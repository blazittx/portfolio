import { useEffect, useRef, useState } from 'react'

export default function BaseWidget({ children, className = '', padding = '4px 0 4px 4px', style = {} }) {
  const containerRef = useRef(null)
  const [sizeClass, setSizeClass] = useState('')

  // Add scrollbar and animation styles once
  useEffect(() => {
    if (!document.getElementById('base-widget-styles')) {
      const style = document.createElement('style')
      style.id = 'base-widget-styles'
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* Prevent text selection in widgets */
        [data-base-widget], [data-base-widget] * {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        /* Allow text selection in input and textarea elements */
        [data-base-widget] input,
        [data-base-widget] textarea {
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
        }
        /* Custom scrollbar styling */
        [data-base-widget] * {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        [data-base-widget] *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        [data-base-widget] *::-webkit-scrollbar-track {
          background: transparent;
          margin: 0;
        }
        [data-base-widget] *::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        [data-base-widget] *::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `
      document.head.appendChild(style)
    }
  }, [])

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

  // Get base widget style
  const getBaseWidgetStyle = () => {
    const baseStyle = {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding,
      overflow: 'hidden',
      minHeight: 0,
      position: 'relative',
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      ...style
    }

    // Apply responsive styles based on size classes
    if (sizeClass.includes('very-short')) {
      baseStyle.fontSize = '0.9em'
    }

    return baseStyle
  }

  return (
    <div 
      ref={containerRef} 
      data-base-widget
      className={className}
      style={getBaseWidgetStyle()}
    >
      {children}
    </div>
  )
}

