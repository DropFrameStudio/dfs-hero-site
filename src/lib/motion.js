// Shared motion state. Written by the scroll engine (Lenis) and the pointer,
// read every frame by the 3D camera and the DOM effects. Plain mutable object on
// purpose: nothing here should trigger a React re-render.
import Lenis from 'lenis'

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isTouch =
  typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches

export const motion = {
  scrollY: 0,
  velocity: 0, // px per frame from Lenis, signed
  chapter: 0, // continuous chapter position, e.g. 1.4 = 40% of the way from chapter 1 to 2
  intro: reducedMotion ? 1 : 0, // 0 -> 1 while the opening camera move plays
  ready: false, // loader finished
  pointer: { x: 0, y: 0 }, // -1..1, centred
  drag: { active: false, yaw: 0, pitch: 0 }, // radians, added on top of the shot
}

let lenis = null

export function startScroll() {
  lenis = new Lenis({
    // Heavy, gliding scroll: low lerp = more inertia
    lerp: reducedMotion ? 1 : 0.07,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.4,
    smoothWheel: !reducedMotion,
  })
  lenis.stop() // locked until the intro finishes
  window.__lenis = lenis // handy in the browser console: __lenis.scrollTo('#work')
  lenis.on('scroll', (l) => {
    motion.scrollY = l.scroll
    motion.velocity = l.velocity
  })
  const raf = (t) => {
    lenis.raf(t)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)
  return lenis
}

export const getLenis = () => lenis

export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: reducedMotion ? 0 : 2.2, easing: easeInOutExpo })
  else el.scrollIntoView()
}

// --- easing helpers
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))
export const easeInOutExpo = (t) =>
  t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2
// frame-rate independent damping
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt))
