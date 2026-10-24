// Embed build: mounts just the 3D room (loader, opening move, parallax, drag-look) into an
// element on another site, e.g. the Webflow homepage hero.
//
//   <div data-dfs-room data-dfs-start="hero"></div>            the slot the room fills
//   <div data-dfs-shot="window">02 Portrait study</div>        optional picker items: click = move camera
//   <link rel="stylesheet" href=".../dfs-hero.css">
//   <script type="module" src=".../dfs-hero.js"></script>
//
// Shot names are the keys of SHOTS in content.js (hero, screen, poster, window, reel, seats).
// Picker items get aria-pressed and the class in data-dfs-active-class (default "is-current").
import { createRoot } from 'react-dom/client'
import { useCallback, useEffect, useState } from 'react'
import gsap from 'gsap'
import Stage from './scene/Stage.jsx'
import Leader from './ui/Leader.jsx'
import { motion, reducedMotion } from './lib/motion.js'
import { SHOTS } from './content.js'
import './embed.css'

gsap.ticker.lagSmoothing(0)

// Stop rendering while the slot is off screen, so the rest of the page scrolls smoothly
function useVisible(el) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' })
    io.observe(el)
    return () => io.disconnect()
  }, [el])
  return visible
}

function Room({ host }) {
  const visible = useVisible(host)
  const onDone = useCallback(() => {
    motion.ready = true
    host.dataset.dfsReady = 'true'
    if (reducedMotion) {
      motion.intro = 1
      return
    }
    gsap.to(motion, { intro: 1, duration: 3.8, ease: 'expo.out' })
  }, [host])

  return (
    <>
      <Stage className="dfs-stage" frameloop={visible ? 'always' : 'never'} />
      <Leader onDone={onDone} />
    </>
  )
}

function wirePicker() {
  const items = [...document.querySelectorAll('[data-dfs-shot]')]
  if (!items.length) return
  const select = (item) => {
    const shot = item.dataset.dfsShot
    if (!SHOTS[shot]) return
    motion.shot = shot
    items.forEach((i) => {
      const on = i === item
      i.setAttribute('aria-pressed', String(on))
      i.classList.toggle(i.dataset.dfsActiveClass || 'is-current', on)
    })
  }
  items.forEach((item) => {
    item.setAttribute('role', 'button')
    item.tabIndex = 0
    item.style.cursor = 'pointer'
    item.addEventListener('click', () => select(item))
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        select(item)
      }
    })
  })
  const start = items.find((i) => i.dataset.dfsShot === motion.shot) || items[0]
  select(start)
}

function mount() {
  // One room per page: the camera state is shared
  const host = document.querySelector('[data-dfs-room]')
  if (!host || host.dataset.dfsMounted) return
  host.dataset.dfsMounted = 'true'
  motion.shot = SHOTS[host.dataset.dfsStart] ? host.dataset.dfsStart : 'hero'
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative'
  const el = document.createElement('div')
  el.className = 'dfs-room'
  host.appendChild(el)
  createRoot(el).render(<Room host={host} />)
  wirePicker()
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
else mount()
