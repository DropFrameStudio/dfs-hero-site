import { useEffect, useRef } from 'react'
import { isTouch, reducedMotion } from '../lib/motion.js'

// A dot that tracks the pointer exactly and a ring that trails it with weight.
// Hovering anything with data-cursor="label" swaps the ring for a labelled disc.
export default function Cursor() {
  const dot = useRef()
  const ring = useRef()
  const label = useRef()

  useEffect(() => {
    if (isTouch) return
    document.documentElement.classList.add('has-cursor')
    const p = { x: innerWidth / 2, y: innerHeight / 2 }
    const r = { x: p.x, y: p.y }
    let current = ''
    const move = (e) => {
      p.x = e.clientX
      p.y = e.clientY
      const t = e.target.closest?.('[data-cursor]')
      const next = t ? t.dataset.cursor : e.target.closest?.('a,button') ? 'link' : e.target.tagName === 'CANVAS' ? 'Drag' : ''
      if (next !== current) {
        current = next
        ring.current.dataset.state = next === 'link' ? 'link' : next === 'Drag' ? 'hint' : next ? 'label' : ''
        label.current.textContent = next && next !== 'link' ? next : ''
      }
    }
    const leave = () => (ring.current.dataset.hidden = 'true')
    const enter = () => delete ring.current.dataset.hidden
    let raf
    const loop = () => {
      const k = reducedMotion ? 1 : 0.16
      r.x += (p.x - r.x) * k
      r.y += (p.y - r.y) * k
      dot.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
      ring.current.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    loop()
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', leave)
    document.addEventListener('pointerenter', enter)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      document.removeEventListener('pointerenter', enter)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])

  if (isTouch) return null
  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring" ref={ring}>
        <span ref={label} />
      </div>
      <div className="cursor__dot" ref={dot} />
    </div>
  )
}
