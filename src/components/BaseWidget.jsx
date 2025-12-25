import { useEffect, useRef, useState } from 'react'
import './Widget.css'

export default function BaseWidget({ children, className = '' }) {
  const containerRef = useRef(null)
  const [sizeClass, setSizeClass] = useState('')

  useEffect(() => {
    const updateSizeClass = () => {
      if (!containerRef.current) return
      
      const { width, height } = containerRef.current.getBoundingClientRect()
      
      // Determine size classes based on dimensions
      const isNarrow = width < 200
      const isShort = height < 150
      const isVeryShort = height < 100
      const isVeryNarrow = width < 150
      
      let classes = []
      if (isNarrow) classes.push('narrow')
      if (isShort) classes.push('short')
      if (isVeryShort) classes.push('very-short')
      if (isVeryNarrow) classes.push('very-narrow')
      
      setSizeClass(classes.join(' '))
    }

    updateSizeClass()
    const resizeObserver = new ResizeObserver(updateSizeClass)
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className={`base-widget ${className} ${sizeClass}`}>
      {children}
    </div>
  )
}

