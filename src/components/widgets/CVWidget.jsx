import BaseWidget from './BaseWidget'
import { useEffect, useRef, useState } from 'react'
import { generateCVPDF } from '../../utils/generateCVPDF'

/* eslint-disable react/prop-types */
export default function CVWidget({ onCVClick, wasLastInteractionDrag, widgetId }) {
  const containerRef = useRef(null)
  const [sizeClass, setSizeClass] = useState('')

  useEffect(() => {
    const updateSizeClass = () => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const isShort = height < 150
      const isVeryShort = height < 100
      const isNarrow = width < 200
      let classes = []
      if (isShort) classes.push('short')
      if (isVeryShort) classes.push('very-short')
      if (isNarrow) classes.push('narrow')
      setSizeClass(classes.join(' '))
    }
    updateSizeClass()
    const resizeObserver = new ResizeObserver(updateSizeClass)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [])

  const handleClick = async (e) => {
    // Only download PDF if it wasn't a drag
    if (e.button === 0) {
      setTimeout(async () => {
        const wasDrag =
          wasLastInteractionDrag &&
          typeof wasLastInteractionDrag === 'function'
            ? wasLastInteractionDrag(widgetId)
            : false

        if (!wasDrag) {
          try {
            await generateCVPDF()
          } catch (error) {
            console.error('Failed to generate PDF:', error)
            // Fallback to navigation if PDF generation fails
            if (onCVClick) {
              onCVClick()
            }
          }
        }
      }, 10)
    }
  }

  return (
    <BaseWidget padding="1rem 0.75rem 1rem 1rem" style={{ gap: '0.75rem' }}>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onMouseUp={handleClick}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: sizeClass.includes('very-short')
                ? '2rem'
                : sizeClass.includes('short')
                ? '2.5rem'
                : '3rem',
              fontWeight: 600,
              color: 'canvasText',
              lineHeight: 1.2,
            }}
          >
            📄
          </div>
          <h4
            style={{
              fontSize: sizeClass.includes('short')
                ? '1rem'
                : sizeClass.includes('very-short')
                ? '0.9375rem'
                : '1.125rem',
              fontWeight: 600,
              margin: 0,
              color: 'canvasText',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            CV / Resume
          </h4>
          <p
            style={{
              fontSize: sizeClass.includes('short') ? '0.75rem' : '0.8125rem',
              lineHeight: 1.5,
              opacity: 0.7,
              color: 'canvasText',
              margin: 0,
              display: sizeClass.includes('very-short') ? 'none' : 'block',
            }}
          >
            View my CV
          </p>
        </div>
      </div>
    </BaseWidget>
  )
}

