import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './App.css'

function App() {
  const containerRef = useRef(null)

  useEffect(() => {
    // Wait a bit to ensure DOM is fully ready
    const timer = setTimeout(() => {
      initWillemLoadingAnimation()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  function initWillemLoadingAnimation() {
    const container = containerRef.current || document.querySelector(".willem-header");
    if (!container) {
      console.error("Willem header container not found");
      return;
    }

    // Remove hidden class immediately so animation can start
    container.classList.remove('is--hidden');
    
    // Force a reflow to ensure display change takes effect
    container.offsetHeight;

    const loadingLetter = container.querySelectorAll(".willem__letter");
    const box = container.querySelectorAll(".willem-loader__box");
    const growingImage = container.querySelectorAll(".willem__growing-image");
    const headingStart = container.querySelectorAll(".willem__h1-start");
    const headingEnd = container.querySelectorAll(".willem__h1-end");
    const coverImageExtra = container.querySelectorAll(".willem__cover-image-extra");
    const headerLetter = container.querySelectorAll(".willem__letter-white");
    const navLinks = container.querySelectorAll(".willen-nav a, .osmo-credits__p");
    
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
    <section ref={containerRef} className="willem-header is--loading is--hidden">
      <div className="willem-loader">
        <div className="willem__h1">
          <div className="willem__h1-start">
            <span className="willem__letter">D</span>
            <span className="willem__letter">o</span>
          </div>
          <div className="willem-loader__box">
            <div className="willem-loader__box-inner">
              <div className="willem__growing-image">
                <div className="willem__growing-image-wrap">
                  <img className="willem__cover-image-extra is--1" src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724bc_minimalist-architecture-2.avif" loading="lazy" alt="" />
                  <img className="willem__cover-image-extra is--2" src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724cf_minimalist-architecture-4.avif" loading="lazy" alt="" />
                  <img className="willem__cover-image-extra is--3" src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724c5_minimalist-architecture-3.avif" loading="lazy" alt="" />
                  <img className="willem__cover-image" src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724b0_minimalist-architecture-1.avif" loading="lazy" alt="" />
                </div>
              </div>
            </div>
          </div>
          <div className="willem__h1-end">
            <span className="willem__letter">r</span>
            <span className="willem__letter">u</span>
            <span className="willem__letter">k</span>
          </div>
        </div>
      </div>
      <div className="willem-header__content">
        <div className="willem-header__top">
          <nav className="willen-nav">
            <div className="willem-nav__start">
              <a href="https://www.osmo.supply?utm_source=codepen&utm_medium=pen&utm_campaign=willem-loading-animation" target="_blank" className="willem-nav__link">Osmo ©</a>
            </div>
            <div className="willem-nav__end">
              <div className="willem-nav__links">
                <a href="https://www.osmo.supply?utm_source=codepen&utm_medium=pen&utm_campaign=willem-loading-animation" target="_blank" className="willem-nav__link">Projects,</a>
                <a href="https://www.osmo.supply?utm_source=codepen&utm_medium=pen&utm_campaign=willem-loading-animation" target="_blank" className="willem-nav__link">Services,</a>
                <a href="https://www.osmo.supply?utm_source=codepen&utm_medium=pen&utm_campaign=willem-loading-animation" target="_blank" className="willem-nav__link">Blog (13)</a>
              </div>
              <div className="willem-nav__cta">
                <a href="https://www.osmo.supply?utm_source=codepen&utm_medium=pen&utm_campaign=willem-loading-animation" target="_blank" className="willem-nav__link">Get in touch</a>
              </div>
            </div>
          </nav>
        </div>
        <div className="willem-header__bottom">
          <div className="willem__h1">
            <span className="willem__letter-white">D</span>
            <span className="willem__letter-white">o</span>
            <span className="willem__letter-white">r</span>
            <span className="willem__letter-white">u</span>
            <span className="willem__letter-white">k </span>
            <span className="willem__letter-white is--space">©</span>
          </div>
          <p className="osmo-credits__p">Resource by <a href="https://www.osmo.supply?utm_source=codepen&utm_medium=pen&utm_campaign=willem-loading-animation" target="_blank" className="osmo-credits__p-a">Osmo</a></p>
        </div>
      </div>
    </section>
  )
}

export default App

