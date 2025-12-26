import { useState, useCallback, useRef } from 'react'
import { gsap } from 'gsap'

export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isInitialMountRef = useRef(true)

  const animateWidgetsOut = useCallback(() => {
    return new Promise((resolve) => {
      const widgetElements = document.querySelectorAll('[data-widget-id]')
      const gridMaskElements = document.querySelectorAll('[data-grid-mask-id]')
      
      if (widgetElements.length > 0) {
        // Hide grid masks immediately (no animation)
        gridMaskElements.forEach(el => {
          el.style.display = 'none'
          el.style.visibility = 'hidden'
        })
        
        // Only animate widgets out
        gsap.to(widgetElements, {
          opacity: 0,
          scale: 0.8,
          y: -20,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          duration: 0.3,
          stagger: 0.03,
          ease: 'power2.in',
          onComplete: () => {
            // Hide widgets completely after animation
            widgetElements.forEach(el => {
              el.style.display = 'none'
              el.style.visibility = 'hidden'
              el.style.pointerEvents = 'none'
            })
            resolve()
          }
        })
      } else {
        // No widgets, just hide masks
        gridMaskElements.forEach(el => {
          el.style.display = 'none'
          el.style.visibility = 'hidden'
        })
        resolve()
      }
    })
  }, [])

  const animateWidgetsIn = useCallback(() => {
    return new Promise((resolve) => {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const widgetElements = document.querySelectorAll('[data-widget-id]')
        const gridMaskElements = document.querySelectorAll('[data-grid-mask-id]')
        
        if (widgetElements.length > 0 || gridMaskElements.length > 0) {
          // Make widgets visible and restore display first
          widgetElements.forEach(el => {
            el.style.display = 'block'
            el.style.visibility = 'visible'
            el.style.pointerEvents = 'auto'
          })
          
          // Make grid masks visible immediately (no animation)
          gridMaskElements.forEach(el => {
            el.style.display = 'block'
            el.style.visibility = 'visible'
            el.style.opacity = '1'
            el.style.backgroundColor = 'hsl(0 0% 4%)'
          })
          
          // Disable CSS transitions for widgets during animation to prevent double flash
          widgetElements.forEach(el => {
            const originalTransition = el.style.transition
            el.style.transition = 'none'
            
            // Restore transition after animation
            setTimeout(() => {
              el.style.transition = originalTransition || ''
            }, 500)
          })
          
          // Set initial state for widgets
          gsap.set(widgetElements, {
            opacity: 0,
            scale: 0.8,
            y: 20,
            backgroundColor: 'hsl(0 0% 4%)',
            borderColor: '#777777'
          })
          
          // Animate widgets in
          if (widgetElements.length > 0) {
            gsap.to(widgetElements, {
              opacity: 1,
              scale: 1,
              y: 0,
              backgroundColor: 'hsl(0 0% 4%)',
              duration: 0.4,
              stagger: 0.05,
              ease: 'power2.out',
              onComplete: resolve
            })
          } else {
            resolve()
          }
        } else {
          resolve()
        }
      }, 50)
    })
  }, [])

  const transition = useCallback(async () => {
    setIsTransitioning(true)
    
    // Animate widgets out
    await animateWidgetsOut()
    
    // Brief pause between animations
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Return promise that resolves when widgets are animated in
    // The caller should update the view, then call animateWidgetsIn
    return animateWidgetsIn
  }, [animateWidgetsOut, animateWidgetsIn])

  // Initial animation for widgets on mount
  const animateInitial = useCallback(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      setTimeout(() => {
        animateWidgetsIn().then(() => {
          setIsTransitioning(false)
        })
      }, 100)
    }
  }, [animateWidgetsIn])

  return { 
    isTransitioning, 
    transition, 
    animateInitial,
    animateWidgetsIn 
  }
}

