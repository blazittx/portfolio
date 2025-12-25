import { useCallback } from 'react'
import { gsap } from 'gsap'

export function useHeroAnimation(containerRef) {
  const startAnimation = useCallback(() => {
    const container = containerRef.current || document.querySelector(".hero-header")
    if (!container) {
      console.error("Hero header container not found")
      return
    }

    // Remove hidden class immediately so animation can start
    container.classList.remove('is--hidden')
    
    // Force a reflow to ensure display change takes effect
    container.offsetHeight

    const loadingLetter = container.querySelectorAll(".hero__letter")
    const box = container.querySelectorAll(".hero-loader__box")
    const growingImage = container.querySelectorAll(".hero__growing-image")
    const headingStart = container.querySelectorAll(".hero__h1-start")
    const headingEnd = container.querySelectorAll(".hero__h1-end")
    const coverImageExtra = container.querySelectorAll(".hero__cover-image-extra")
    
    /* GSAP Timeline */
    const tl = gsap.timeline({
      defaults: {
        ease: "expo.inOut",
      },
      onStart: () => {
        console.log("GSAP timeline started")
      }
    })
    
    /* Start of Timeline */
    if (loadingLetter.length) {
      tl.from(loadingLetter, {
        yPercent: 100,
        stagger: 0.025,
        duration: 1.25
      })
    }
    
    if (box.length) {
      tl.fromTo(box, {
        width: "0em",
      },{
        width: "1em",
        duration: 1.25
      }, "< 1.25")
    }

    if (box.length) {
      // Set initial max-height constraint
      gsap.set(growingImage, { maxHeight: "1em" })
      
      tl.fromTo(growingImage, {
        width: "0%",
      },{
        width: "100%",
        duration: 1.25
      }, "<")
    }
    
    if (headingStart.length) {
      tl.fromTo(headingStart, {
        x: "0em",
      },{
        x: "-0.05em",
        duration: 1.25
      }, "<")
    }
    
    if (headingEnd.length) {
      tl.fromTo(headingEnd, {
        x: "0em",
      },{
        x: "0.05em",
        duration: 1.25
      }, "<")
    }

    if (coverImageExtra.length) {
      tl.fromTo(coverImageExtra, {
        opacity: 1,
      },{
        opacity: 0,
        duration: 0.05,
        ease: "none",
        stagger: 0.5
      }, "-=0.05")
    }
      
    if (growingImage.length) {
      tl.to(growingImage, {
        width: "100vw",
        height: "100dvh",
        maxHeight: "none",
        duration: 2
      }, "< 1.25")
    }
    
    if (box.length) {
      tl.to(box, {
        width: "110vw",
        duration: 2
      }, "<")
    }
    
    // Ensure timeline plays
    tl.play()
    console.log("GSAP timeline created and playing")
  }, [containerRef])

  return { startAnimation }
}

