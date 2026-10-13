import { useEffect, useRef } from 'react'
import { WORK } from '../content.js'
import { motion, clamp, reducedMotion } from '../lib/motion.js'

// The work section: vertical scroll pins the section and runs a strip of film sideways.
// Scroll speed bends the strip (skew) and slides each still inside its frame (parallax).
export default function Reel({ id }) {
  const section = useRef()
  const track = useRef()
  const frames = useRef([])

  useEffect(() => {
    let raf
    let skew = 0
    const loop = () => {
      const s = section.current
      const t = track.current
      if (s && t) {
        const top = s.getBoundingClientRect().top + window.scrollY
        const run = s.offsetHeight - innerHeight
        const p = clamp((motion.scrollY - top) / Math.max(1, run), 0, 1)
        const travel = t.scrollWidth - innerWidth
        const target = reducedMotion ? 0 : clamp(-motion.velocity * 0.35, -9, 9)
        skew += (target - skew) * 0.12
        t.style.transform = `translate3d(${-p * travel}px,0,0) skewX(${skew.toFixed(2)}deg)`
        // inner image drifts against the strip so each still feels like a window
        frames.current.forEach((img, i) => {
          if (!img) return
          const r = img.parentElement.getBoundingClientRect()
          const centre = (r.left + r.width / 2) / innerWidth - 0.5
          img.style.transform = `translate3d(${(-centre * 12).toFixed(2)}%,0,0) scale(1.18)`
        })
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section id={id} className="reel" ref={section} data-reveal>
      <div className="reel__pin">
        <h2 className="reel__title">Selected work</h2>
        <div className="reel__strip">
          <ol className="reel__track" ref={track}>
            {WORK.map((w, i) => (
              <li className="reel__item" key={w.title}>
                <a className="reel__frame" href="#" onClick={(e) => e.preventDefault()} data-cursor="View">
                  <img ref={(el) => (frames.current[i] = el)} src={w.image} alt="" loading="lazy" draggable="false" />
                </a>
                <p className="reel__caption">
                  <span className="reel__name">{w.title}</span>
                  <span className="reel__meta">
                    {w.client}, {w.year}
                  </span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
