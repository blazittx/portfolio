import { useEffect, useRef, useState } from 'react'
import './Widget.css'

export default function BaseWidget({ children, className = '', padding = '4px 0 4px 4px', style = {} }) {
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

  // Merge padding with custom styles (custom styles take precedence)
  const mergedStyle = {
    padding,
    ...style
  }

  return (
    <div 
      ref={containerRef} 
      className={`base-widget ${className} ${sizeClass}`}
      style={mergedStyle}
    >
      {children}
    </div>
  )
}

