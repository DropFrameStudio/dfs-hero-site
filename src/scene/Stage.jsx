import * as THREE from 'three'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, MeshReflectorMaterial, useTexture } from '@react-three/drei'
import { EffectComposer, DepthOfField, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { CHAPTERS, SHOTS } from '../content.js'
import { motion, isTouch, reducedMotion, clamp, lerp, damp, smoothstep, easeInOutCubic } from '../lib/motion.js'

const MODEL = '/models/dfs_hero_web.glb'
const CAM_POS = new THREE.Vector3(-1.726, 0.418, -0.059) // the one point the panorama is correct from
const SHIFT_Y = -0.068 // Blender lens shift, re-applied with setViewOffset
const SENSOR = 36
const BEAM_GAIN = 1.4
const DEG = Math.PI / 180
const CA_OFFSET = new THREE.Vector2(0, 0) // RGB split amount, driven by scroll speed

// ------------------------------------------------------------------ model
function Room() {
  const gl = useThree((s) => s.gl)
  const { scene } = useGLTF(MODEL, '/draco/', true, (loader) => {
    loader.setKTX2Loader(new KTX2Loader().setTranscoderPath('/basis/').detectSupport(gl))
  })
  const wetMask = useTexture('/textures/floor_wetness.webp')
  wetMask.colorSpace = THREE.NoColorSpace
  wetMask.flipY = false

  useEffect(() => {
    scene.traverse((o) => {
      if (!o.isMesh) return
      const m = o.material
      m.toneMapped = false // lighting is baked and already display-ready
      if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
      if (o.name.startsWith('FX_')) {
        m.transparent = true
        m.depthWrite = false
        m.blending = THREE.AdditiveBlending
        o.layers.set(1) // camera sees it, the floor reflection doesn't
      }
      if (o.name === 'FX_ProjectorBeam') m.color.setScalar(BEAM_GAIN)
      if (o.name === 'WEB_Vegetation') {
        m.alphaTest = 0.5
        m.side = THREE.DoubleSide
        m.vertexColors = true
      }
      if (o.name === 'WEB_Backdrop') {
        m.fog = false
        m.depthWrite = false
        o.renderOrder = -1
      }
    })
  }, [scene])

  const floor = scene.getObjectByName('WEB_Floor')
  return (
    <>
      <primitive object={scene} />
      <ambientLight intensity={1} />
      {floor && (
        // Live wet-floor reflections, added on top of the baked floor only where the mask is white
        <mesh
          geometry={floor.geometry}
          position={[floor.position.x, floor.position.y + 0.003, floor.position.z]}
          quaternion={floor.quaternion}
          scale={floor.scale}
          renderOrder={1}
        >
          <MeshReflectorMaterial
            resolution={isTouch ? 512 : 1024}
            mirror={1}
            mixStrength={0.7}
            mixContrast={1.35}
            mixBlur={0.15}
            blur={[40, 20]}
            depthScale={0.3}
            minDepthThreshold={0.5}
            color="#a8a8a8"
            metalness={0}
            roughness={1}
            alphaMap={wetMask}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      )}
    </>
  )
}

// ------------------------------------------------------------------ camera director
// Scroll position -> which shot we're on -> yaw / pitch / lens / focus, then layered with
// the intro move, pointer parallax, click-drag look and a little velocity "breath".
function useSectionAnchors() {
  const anchors = useRef([])
  useEffect(() => {
    const measure = () => {
      anchors.current = CHAPTERS.map((c) => {
        const el = document.getElementById(c.id)
        return el ? el.getBoundingClientRect().top + window.scrollY : 0
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  return anchors
}

function shotAt(anchors, y) {
  const a = anchors.current
  if (!a.length) return { from: SHOTS.hero, to: SHOTS.hero, t: 0, chapter: 0 }
  let i = 0
  while (i < a.length - 1 && y >= a[i + 1]) i++
  const next = Math.min(i + 1, a.length - 1)
  const span = Math.max(1, a[next] - a[i])
  const frac = next === i ? 0 : clamp((y - a[i]) / span, 0, 1)
  // hold the shot for the first part of each section, then travel to the next one
  const t = easeInOutCubic(smoothstep(0.3, 0.95, frac))
  return { from: SHOTS[CHAPTERS[i].shot], to: SHOTS[CHAPTERS[next].shot], t, chapter: i + frac }
}

function CameraDirector({ dofRef }) {
  const { camera, size, gl } = useThree()
  const anchors = useSectionAnchors()
  const cur = useRef({ yaw: SHOTS.hero.yaw + 18, pitch: SHOTS.hero.pitch + 9, lens: 16, roll: 0 })
  const look = useRef({ yaw: 0, pitch: 0 })
  const focus = useMemo(() => new THREE.Vector3(...SHOTS.hero.focus), [])
  const tmpA = useMemo(() => new THREE.Vector3(), [])
  const tmpB = useMemo(() => new THREE.Vector3(), [])
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), [])

  useEffect(() => {
    camera.position.copy(CAM_POS)
    camera.near = 0.05
    camera.far = 200
    camera.layers.enable(1)
  }, [camera])

  // click-and-drag to look around, springs back on release (mouse only)
  useEffect(() => {
    if (isTouch) return
    const el = gl.domElement
    let start = null
    const down = (e) => {
      if (!motion.ready) return
      start = { x: e.clientX, y: e.clientY, yaw: motion.drag.yaw, pitch: motion.drag.pitch }
      motion.drag.active = true
      document.documentElement.dataset.dragging = 'true'
    }
    const move = (e) => {
      motion.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      motion.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
      if (!start) return
      motion.drag.yaw = clamp(start.yaw + ((e.clientX - start.x) / window.innerWidth) * 1.4, -20 * DEG, 20 * DEG)
      motion.drag.pitch = clamp(start.pitch + ((e.clientY - start.y) / window.innerHeight) * 0.8, -10 * DEG, 10 * DEG)
    }
    const up = () => {
      start = null
      motion.drag.active = false
      delete document.documentElement.dataset.dragging
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [gl])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const { from, to, t, chapter } = shotAt(anchors, motion.scrollY)
    motion.chapter = chapter

    // 1. where the scroll says we should be
    let yaw = lerp(from.yaw, to.yaw, t)
    let pitch = lerp(from.pitch, to.pitch, t)
    let lens = lerp(from.lens, to.lens, t)

    // 2. opening move: starts wide and turned toward the tear, settles into the hero shot
    const k = motion.intro
    yaw += (1 - k) * 18
    pitch += (1 - k) * 9
    lens = lerp(16, lens, k)

    // 3. scroll velocity: a slight pull-back and roll while moving fast
    const v = reducedMotion ? 0 : motion.velocity
    lens -= clamp(Math.abs(v) * 0.09, 0, 4)
    const roll = clamp(-v * 0.02, -0.8, 0.8)

    // 4. damped follow = the floaty, weighted feel
    const c = cur.current
    const follow = reducedMotion ? 30 : motion.intro < 1 ? 8 : 3.2
    c.yaw = damp(c.yaw, yaw, follow, dt)
    c.pitch = damp(c.pitch, pitch, follow, dt)
    c.lens = damp(c.lens, lens, follow, dt)
    c.roll = damp(c.roll, roll, 4, dt)

    // 5. pointer parallax + drag look (springs back when released)
    const lk = look.current
    const px = isTouch || reducedMotion ? 0 : -motion.pointer.x * 2.2 * DEG
    const py = isTouch || reducedMotion ? 0 : -motion.pointer.y * 1.3 * DEG
    if (!motion.drag.active) {
      motion.drag.yaw = damp(motion.drag.yaw, 0, 2.5, dt)
      motion.drag.pitch = damp(motion.drag.pitch, 0, 2.5, dt)
    }
    lk.yaw = damp(lk.yaw, px + motion.drag.yaw, motion.drag.active ? 12 : 3, dt)
    lk.pitch = damp(lk.pitch, py + motion.drag.pitch, motion.drag.active ? 12 : 3, dt)

    euler.set(c.pitch * DEG + lk.pitch, c.yaw * DEG + lk.yaw, c.roll * DEG)
    camera.quaternion.setFromEuler(euler)

    // lens -> field of view (36 mm horizontal fit; portrait screens fit the long side instead)
    const aspect = size.width / size.height
    const fitW = aspect >= 1 ? SENSOR / aspect : SENSOR
    camera.fov = (2 * Math.atan(fitW / 2 / c.lens)) / DEG
    camera.setViewOffset(size.width, size.height, 0, -SHIFT_Y * Math.max(size.width, size.height), size.width, size.height)
    camera.updateProjectionMatrix()

    // focus pull follows the shot
    tmpA.fromArray(from.focus)
    tmpB.fromArray(to.focus)
    focus.lerpVectors(tmpA, tmpB, t)
    if (dofRef.current?.target) dofRef.current.target.lerp(focus, 1 - Math.exp(-4 * dt))

    // RGB split grows with scroll speed
    const ca = reducedMotion ? 0 : clamp(Math.abs(v) * 0.00012, 0, 0.0035)
    CA_OFFSET.set(ca, ca * 0.5)
  })
  return null
}

// ------------------------------------------------------------------ canvas
export default function Stage() {
  const dofRef = useRef()
  return (
    <Canvas
      className="stage"
      dpr={[1, isTouch ? 1.5 : 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      camera={{ position: CAM_POS.toArray(), fov: 50, near: 0.05, far: 200 }}
      aria-hidden="true"
    >
      <color attach="background" args={['#e8d4b6']} />
      <fog attach="fog" args={['#f2c48d', 12, 70]} />
      <Suspense fallback={null}>
        <Room />
      </Suspense>
      <CameraDirector dofRef={dofRef} />
      <EffectComposer multisampling={0}>
        <DepthOfField ref={dofRef} focusDistance={0} focalLength={0.02} bokehScale={3.5} target={SHOTS.hero.focus} />
        <Bloom intensity={0.6} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
        <ChromaticAberration offset={CA_OFFSET} radialModulation={false} modulationOffset={0} />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.25} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  )
}
