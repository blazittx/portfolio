import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import './Navigation.css'

const NAV_ITEMS = {
  left: { type: 'logo', href: '#', image: '/image.png', alt: 'BLAZITx Logo' },
  center: [
    { text: 'Projects,', href: '#' },
    { text: 'Education,', href: '#' },
    { text: 'Resume', href: '#' }
  ],
  right: { text: 'Get in touch', href: '#' }
}

function Navigation() {
  const navRef = useRef(null)
  const logoRef = useRef(null)
  const centerLinksRef = useRef(null)
  const rightLinkRef = useRef(null)

  useEffect(() => {
    if (!navRef.current) return

    // Set initial states
    gsap.set([logoRef.current, rightLinkRef.current], {
      opacity: 0,
      x: -20
    })

    if (centerLinksRef.current) {
      const links = centerLinksRef.current.querySelectorAll('.hero-nav__link')
      gsap.set(links, {
        opacity: 0,
        y: 10
      })
    }

    // Animate with stagger
    const tl = gsap.timeline({
      delay: 0.2,
      defaults: {
        ease: "power2.out"
      }
    })

    // Logo fades in from left
    tl.to(logoRef.current, {
      opacity: 1,
      x: 0,
      duration: 0.6
    })

    // Center links fade in with stagger
    if (centerLinksRef.current) {
      const links = centerLinksRef.current.querySelectorAll('.hero-nav__link')
      tl.to(links, {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.5
      }, "-=0.3")
    }

    // Right link fades in
    tl.to(rightLinkRef.current, {
      opacity: 1,
      x: 0,
      duration: 0.6
    }, "-=0.4")

  }, [])

  return (
    <nav ref={navRef} className="hero-nav">
      <a 
        ref={logoRef}
        href={NAV_ITEMS.left.href} 
        className="hero-nav__link hero-nav__link--logo"
      >
        <img 
          src={NAV_ITEMS.left.image} 
          alt={NAV_ITEMS.left.alt} 
          className="hero-nav__logo" 
        />
      </a>
      <div ref={centerLinksRef} className="hero-nav__center">
        {NAV_ITEMS.center.map((item, index) => (
          <a 
            key={index} 
            href={item.href} 
            className="hero-nav__link"
          >
            {item.text}
          </a>
        ))}
      </div>
      <a 
        ref={rightLinkRef}
        href={NAV_ITEMS.right.href} 
        className="hero-nav__link hero-nav__link--right"
      >
        {NAV_ITEMS.right.text}
      </a>
    </nav>
  )
}

export default Navigation
