import { useCallback, useEffect } from 'react'
import gsap from 'gsap'
import Stage from './scene/Stage.jsx'
import Leader from './ui/Leader.jsx'
import Cursor from './ui/Cursor.jsx'
import Overlay from './ui/Overlay.jsx'
import { motion, startScroll, getLenis, reducedMotion } from './lib/motion.js'

// Keep GSAP on wall-clock time: the intro shouldn't stretch out if the first frames are slow
gsap.ticker.lagSmoothing(0)

export default function App() {
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const lenis = startScroll()
    return () => lenis.destroy()
  }, [])

  // Loader finished: open the shot, then hand scrolling to the visitor
  const onLeaderDone = useCallback(() => {
    motion.ready = true
    document.documentElement.dataset.ready = 'true'
    if (reducedMotion) {
      motion.intro = 1
      getLenis()?.start()
      return
    }
    gsap.to(motion, { intro: 1, duration: 3.8, ease: 'expo.out' })
    gsap.delayedCall(1.6, () => getLenis()?.start())
  }, [])

  return (
    <>
      <Stage />
      <Overlay />
      <Cursor />
      <Leader onDone={onLeaderDone} />
    </>
  )
}
