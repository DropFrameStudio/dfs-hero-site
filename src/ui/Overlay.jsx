import { useEffect, useRef } from 'react'
import { CHAPTERS, CONTACT_EMAIL } from '../content.js'
import { motion, scrollToId, clamp, smoothstep } from '../lib/motion.js'
import Reel from './Reel.jsx'

// Split a line into characters so each one can rise out of its mask on a stagger.
function Title({ lines, as: Tag = 'h2' }) {
  let i = 0
  return (
    <Tag className="title" aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span className="title__line" key={li} aria-hidden="true">
          {[...line].map((ch) => (
            <span className="title__char" style={{ '--i': i++ }} key={i}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  )
}

function Chapter({ c, index }) {
  const isFirst = index === 0
  const isLast = index === CHAPTERS.length - 1
  return (
    <section id={c.id} className={`chapter ${isFirst ? 'chapter--hero' : ''} ${isLast ? 'chapter--last' : ''}`} data-reveal>
      <div className="chapter__panel">
        <div className="chapter__copy">
          <Title lines={c.title} as={isFirst ? 'h1' : 'h2'} />
          <p className="chapter__body">{c.body}</p>
          {c.cta && (
            <a className="cta" href={`mailto:${CONTACT_EMAIL}`} data-cursor="Email">
              {c.cta}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

// Fixed HUD: timecode that runs with the scroll, and the scrim that dims the room under the reel.
function Hud() {
  const tc = useRef()
  const scrim = useRef()
  const hint = useRef()
  useEffect(() => {
    let raf
    const fps = 24
    const loop = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
      const p = clamp(motion.scrollY / max, 0, 1)
      const total = Math.round(p * 90 * fps) // the whole page = a 90 second reel
      const ff = total % fps
      const ss = Math.floor(total / fps) % 60
      const mm = Math.floor(total / fps / 60)
      const pad = (v) => String(v).padStart(2, '0')
      tc.current.textContent = `00:${pad(mm)}:${pad(ss)}:${pad(ff)}`
      tc.current.style.setProperty('--p', p)
      const reelIndex = CHAPTERS.findIndex((c) => c.reel)
      const ch = motion.chapter
      const dim = smoothstep(reelIndex - 0.45, reelIndex + 0.05, ch) * (1 - smoothstep(reelIndex + 0.7, reelIndex + 1, ch))
      scrim.current.style.opacity = dim.toFixed(3)
      hint.current.style.opacity = (1 - smoothstep(20, 160, motion.scrollY)).toFixed(3)
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <>
      <div className="scrim" ref={scrim} aria-hidden="true" />
      <div className="hud" aria-hidden="true">
        <span className="hud__hint" ref={hint}>Scroll</span>
        <span className="hud__tc" ref={tc}>00:00:00:00</span>
      </div>
    </>
  )
}

export default function Overlay() {
  // Reveal each section's type while it crosses the middle of the screen
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-in', e.isIntersecting)),
      { rootMargin: '-30% 0px -30% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const go = (id) => (e) => {
    e.preventDefault()
    scrollToId(id)
  }

  return (
    <>
      <header className="masthead">
        <a className="wordmark" href="#top" onClick={go('top')} aria-label="Drop Frame Studio, back to top">
          <span>Drop</span>
          <span className="wordmark__frame">Frame</span>
          <span>Studio</span>
        </a>
        <nav className="nav" aria-label="Sections">
          <a href="#work" onClick={go('work')}>Work</a>
          <a href="#studio" onClick={go('studio')}>Studio</a>
          <a href="#contact" onClick={go('contact')}>Contact</a>
        </nav>
      </header>

      <main className="scroller">
        {CHAPTERS.map((c, i) => (c.reel ? <Reel key={c.id} id={c.id} /> : <Chapter key={c.id} c={c} index={i} />))}
      </main>

      <Hud />
    </>
  )
}
