import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { reducedMotion } from '../lib/motion.js'

// Film-leader countdown loader. Counts 8 -> 3 as the scene downloads, then runs 3 -> 2,
// flashes one white frame and wipes away.
const TICK = reducedMotion ? 120 : 360

export default function Leader({ onDone }) {
  const { progress, active } = useProgress()
  const [n, setN] = useState(8)
  const [phase, setPhase] = useState('count') // count -> flash -> out -> gone
  const loaded = useRef(false)
  loaded.current = progress >= 100 && !active

  useEffect(() => {
    if (phase !== 'count') return
    const id = setInterval(() => {
      setN((cur) => {
        const floorN = loaded.current ? 2 : Math.max(3, 8 - Math.floor((progress / 100) * 5))
        return cur > floorN ? cur - 1 : cur
      })
    }, TICK)
    return () => clearInterval(id)
  }, [phase, progress])

  useEffect(() => {
    if (n !== 2 || phase !== 'count') return
    const a = setTimeout(() => setPhase('flash'), TICK)
    return () => clearTimeout(a)
  }, [n, phase])

  useEffect(() => {
    if (phase === 'flash') {
      const a = setTimeout(() => {
        setPhase('out')
        onDone()
      }, 90)
      return () => clearTimeout(a)
    }
    if (phase === 'out') {
      const a = setTimeout(() => setPhase('gone'), 1100)
      return () => clearTimeout(a)
    }
  }, [phase, onDone])

  if (phase === 'gone') return null
  return (
    <div className={`leader leader--${phase}`} role="status" aria-live="polite">
      <div className="leader__frame">
        <span className="leader__cross leader__cross--h" />
        <span className="leader__cross leader__cross--v" />
        <div className="leader__dial">
          <span className="leader__sweep" key={n} />
          <span className="leader__ring leader__ring--outer" />
          <span className="leader__ring leader__ring--inner" />
          <span className="leader__num" aria-hidden="true">{n}</span>
        </div>
      </div>
      <p className="leader__status">Loading the room, {Math.round(progress)}%</p>
    </div>
  )
}
