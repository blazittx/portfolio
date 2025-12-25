import { useCallback } from 'react'
import { gsap } from 'gsap'

export function useContentAnimation() {
  const animateContent = useCallback((elements) => {
    const { nav, title, subtitle, footer } = elements
    
    if (!nav || !title || !footer) return

    // Set initial states
    gsap.set([nav, footer], { opacity: 0 })
    gsap.set(nav, { y: -50 })
    gsap.set(footer, { y: 30 })
    
    if (title) {
      const letters = title.querySelectorAll('.hero-content__letter')
      gsap.set(letters, { opacity: 0, y: 30 })
    }

    if (subtitle) {
      gsap.set(subtitle, { opacity: 0, y: 20 })
    }

    // Create animation timeline
    const tl = gsap.timeline({
      delay: 0.5,
      defaults: {
        ease: "power3.out"
      }
    })

    // Navigation fade in from top
    tl.to(nav, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out"
    })

    // Title letters fade in with stagger
    if (title) {
      const letters = title.querySelectorAll('.hero-content__letter')
      tl.to(letters, {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.5")
    }

    // Subtitle fade in
    if (subtitle) {
      tl.to(subtitle, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.4")
    }

    // Footer fade in from bottom
    tl.to(footer, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.4")

    return tl
  }, [])

  return { animateContent }
}

