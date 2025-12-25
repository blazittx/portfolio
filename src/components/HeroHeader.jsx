import { useRef, useEffect } from 'react'
import { useHeroAnimation } from '../hooks/useHeroAnimation'
import HeroLoader from './HeroLoader'
import HeroContent from './HeroContent'
import './HeroHeader.css'

function HeroHeader() {
  const containerRef = useRef(null)
  const { startAnimation } = useHeroAnimation(containerRef)

  useEffect(() => {
    const timer = setTimeout(() => {
      startAnimation()
    }, 100)

    return () => clearTimeout(timer)
  }, [startAnimation])

  return (
    <section ref={containerRef} className="hero-header is--loading is--hidden">
      <HeroLoader />
      <HeroContent />
    </section>
  )
}

export default HeroHeader

