import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import Navigation from './Navigation'
import './HeroContent.css'

const TITLE_LETTERS = ['D', 'o', 'r', 'u', 'k']

function HeroContent() {
  const navRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const footerRef = useRef(null)

  useEffect(() => {
    // Set initial states
    gsap.set([navRef.current, footerRef.current], { opacity: 0 })
    gsap.set(navRef.current, { y: -50 })
    gsap.set(footerRef.current, { y: 30 })
    
    if (titleRef.current) {
      const letters = titleRef.current.querySelectorAll('.hero-content__letter')
      gsap.set(letters, { opacity: 0, y: 30 })
    }

    if (subtitleRef.current) {
      gsap.set(subtitleRef.current, { opacity: 0, y: 20 })
    }

    // Create animation timeline
    const tl = gsap.timeline({
      delay: 0.5,
      defaults: {
        ease: "power3.out"
      }
    })

    // Navigation fade in from top
    tl.to(navRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out"
    })

    // Title letters fade in with stagger
    if (titleRef.current) {
      const letters = titleRef.current.querySelectorAll('.hero-content__letter')
      tl.to(letters, {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.5")
    }

    // Subtitle fade in
    if (subtitleRef.current) {
      tl.to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.4")
    }

    // Footer fade in from bottom
    tl.to(footerRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.4")

  }, [])

  return (
    <div className="hero-content">
      <div ref={navRef} className="hero-content__nav">
        <Navigation />
      </div>
      
      <div className="hero-content__main">
        <div ref={titleRef} className="hero-content__title">
          {TITLE_LETTERS.map((letter, index) => (
            <span key={index} className="hero-content__letter">
              {letter}
            </span>
          ))}
        </div>
        
        <div ref={subtitleRef} className="hero-content__subtitle">
          <p className="hero-content__subtitle-text">
            Creative Developer & Designer
          </p>
          <p className="hero-content__subtitle-text">
            Building digital experiences
          </p>
        </div>
      </div>

      <div ref={footerRef} className="hero-content__footer">
        <p className="hero-content__credits">
          Made by{' '}
          <a 
            href="https://github.com/blazittx" 
            target="_blank" 
            rel="noreferrer" 
            className="hero-content__credits-link"
          >
            blazitt
          </a>
        </p>
      </div>
    </div>
  )
}

export default HeroContent
