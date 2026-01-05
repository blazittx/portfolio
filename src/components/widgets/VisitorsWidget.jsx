import { useState, useEffect, useRef } from 'react'
import BaseWidget from './BaseWidget'
import { GRID_SIZE } from '../../constants/grid'

export default function VisitorsWidget() {
  const [visitorCount, setVisitorCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef(null)
  const [widgetHeight, setWidgetHeight] = useState(0)

  useEffect(() => {
    // Simulate visitor count (in real app, this would come from an API)
    const generateVisitorCount = () => {
      const baseCount = Math.floor(Math.random() * 50) + 10
      return baseCount
    }

    setVisitorCount(generateVisitorCount())
    
    // Update visitor count periodically
    const interval = setInterval(() => {
      setIsAnimating(true)
      const newCount = generateVisitorCount()
      setVisitorCount(newCount)
      setTimeout(() => setIsAnimating(false), 600)
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return
      const { height } = containerRef.current.getBoundingClientRect()
      setWidgetHeight(height)
    }
    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [])

  // Show title only if widget is at least 3 grid units tall (3 * 45 = 135px)
  const showTitle = widgetHeight >= GRID_SIZE * 3

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '0.75rem',
    justifyContent: 'center',
    alignItems: 'center',
  }

  const titleStyle = {
    fontSize: '1rem',
    fontWeight: 500,
    margin: 0,
    color: 'var(--color-canvas-text, #ffffff)',
    opacity: 0.7,
    letterSpacing: '-0.01em',
    display: showTitle ? 'block' : 'none'
  }

  const countStyle = {
    fontSize: '2.5rem',
    fontWeight: 700,
    margin: 0,
    color: 'var(--color-canvas-text, #ffffff)',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
    opacity: isAnimating ? 0.7 : 1,
  }

  const labelStyle = {
    fontSize: '0.75rem',
    color: 'var(--color-canvas-text, #ffffff)',
    opacity: 0.5,
    marginTop: '-0.5rem',
  }

  return (
    <BaseWidget padding="1rem">
      <div ref={containerRef} style={containerStyle}>
        {showTitle && <h3 style={titleStyle}>Visitors</h3>}
        <div style={countStyle}>{visitorCount}</div>
        <div style={labelStyle}>online now</div>
      </div>
    </BaseWidget>
  )
}

