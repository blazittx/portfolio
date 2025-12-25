import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './App.css'

function App() {
  const containerRef = useRef(null)

  useEffect(() => {
    // Wait a bit to ensure DOM is fully ready
    const timer = setTimeout(() => {
      initHeroLoadingAnimation()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  function initHeroLoadingAnimation() {
    const container = containerRef.current || document.querySelector(".hero-header");
    if (!container) {
      console.error("Hero header container not found");
      return;
    }

    // Remove hidden class immediately so animation can start
    container.classList.remove('is--hidden');
    
    // Force a reflow to ensure display change takes effect
    container.offsetHeight;

    const loadingLetter = container.querySelectorAll(".hero__letter");
    const box = container.querySelectorAll(".hero-loader__box");
    const growingImage = container.querySelectorAll(".hero__growing-image");
    const headingStart = container.querySelectorAll(".hero__h1-start");
    const headingEnd = container.querySelectorAll(".hero__h1-end");
    const coverImageExtra = container.querySelectorAll(".hero__cover-image-extra");
    const headerLetter = container.querySelectorAll(".hero__letter-white");
    const navLinks = container.querySelectorAll(".hero-nav a, .hero-credits__p");
    
    console.log("Animation elements found:", {
      loadingLetter: loadingLetter.length,
      box: box.length,
      growingImage: growingImage.length,
      headerLetter: headerLetter.length,
      navLinks: navLinks.length
    });
    
    /* GSAP Timeline */
    const tl = gsap.timeline({
      defaults: {
        ease: "expo.inOut",
      },
      onStart: () => {
        console.log("GSAP timeline started");
      }
    });
    
    /* Start of Timeline */
    if (loadingLetter.length) {
      tl.from(loadingLetter, {
        yPercent: 100,
        stagger: 0.025,
        duration: 1.25
      });
    }
    
    if (box.length) {
      tl.fromTo(box, {
        width: "0em",
      },{
        width: "1em",
        duration: 1.25
      }, "< 1.25");
    }

    if (box.length) {
      // Set initial max-height constraint
      gsap.set(growingImage, { maxHeight: "1em" });
      
      tl.fromTo(growingImage, {
        width: "0%",
      },{
        width: "100%",
        duration: 1.25
      }, "<");
    }
    
    if (headingStart.length) {
      tl.fromTo(headingStart, {
        x: "0em",
      },{
        x: "-0.05em",
        duration: 1.25
      }, "<");
    }
    
    if (headingEnd.length) {
      tl.fromTo(headingEnd, {
        x: "0em",
      },{
        x: "0.05em",
        duration: 1.25
      }, "<");
    }

    if (coverImageExtra.length) {
      tl.fromTo(coverImageExtra, {
        opacity: 1,
      },{
        opacity: 0,
        duration: 0.05,
        ease: "none",
        stagger: 0.5
      }, "-=0.05");
    }
      
    if (growingImage.length) {
      tl.to(growingImage, {
        width: "100vw",
        height: "100dvh",
        maxHeight: "none",
        duration: 2
      }, "< 1.25");
    }
    
    if (box.length) {
      tl.to(box, {
        width: "110vw",
        duration: 2
      }, "<");
    }
    
    if (headerLetter.length) {
      tl.from(headerLetter, {
        yPercent: 100,
        duration: 1.25,
        ease: "expo.out",
        stagger: 0.025
      }, "< 1.2");
    }

    if (navLinks.length) {
      tl.from(navLinks, {
        yPercent: 100,
        duration: 1.25,
        ease: "expo.out",
        stagger: 0.1
      }, "<");
    }
    
    // Ensure timeline plays
    tl.play();
    console.log("GSAP timeline created and playing");
  }

  return (
    <section ref={containerRef} className="hero-header is--loading is--hidden">
      <div className="hero-loader">
        <div className="hero__h1">
          <div className="hero__h1-start">
            <span className="hero__letter">D</span>
            <span className="hero__letter">o</span>
          </div>
          <div className="hero-loader__box">
            <div className="hero-loader__box-inner">
              <div className="hero__growing-image">
                <div className="hero__growing-image-wrap">
                  <img className="hero__cover-image-extra is--1" src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724bc_minimalist-architecture-2.avif" loading="lazy" alt="" />
                  <img className="hero__cover-image-extra is--2" src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724cf_minimalist-architecture-4.avif" loading="lazy" alt="" />
                  <img className="hero__cover-image-extra is--3" src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724c5_minimalist-architecture-3.avif" loading="lazy" alt="" />
                  <img className="hero__cover-image" src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724b0_minimalist-architecture-1.avif" loading="lazy" alt="" />
                </div>
              </div>
            </div>
          </div>
          <div className="hero__h1-end">
            <span className="hero__letter">r</span>
            <span className="hero__letter">u</span>
            <span className="hero__letter">k</span>
          </div>
        </div>
      </div>
      <div className="hero-header__content">
        <div className="hero-header__top">
          <nav className="hero-nav">
            <a href="#" target="_blank" className="hero-nav__link">
              <img src="/image.png" alt="BLAZITx Logo" className="hero-nav__logo" />
            </a>
            <div className="hero-nav__center">
              <a href="#" target="_blank" className="hero-nav__link">Projects,</a>
              <a href="#" target="_blank" className="hero-nav__link">Education,</a>
              <a href="#" target="_blank" className="hero-nav__link">Resume</a>
            </div>
            <a href="#" target="_blank" className="hero-nav__link">Get in touch</a>
          </nav>
        </div>
        <div className="hero-header__bottom">
          <div className="hero__h1">
            <span className="hero__letter-white">D</span>
            <span className="hero__letter-white">o</span>
            <span className="hero__letter-white">r</span>
            <span className="hero__letter-white">u</span>
            <span className="hero__letter-white">k</span>
          </div>
          <p className="hero-credits__p">Made by <a href="https://github.com/blazittx" target="_blank" rel="noreferrer" className="hero-credits__p-a">blazitt</a></p>
        </div>
      </div>
    </section>
  )
}

export default App

