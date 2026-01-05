import { useState, useEffect, useRef } from 'react'
import BaseWidget from './BaseWidget'
import { GRID_SIZE } from '../../constants/grid'

const MESSAGES = [
  "Today is a great day to build something amazing!",
  "Code with purpose, create with passion.",
  "Every bug is a learning opportunity.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Simplicity is the ultimate sophistication.",
  "Make it work, make it right, make it fast.",
  "The only way to do great work is to love what you do.",
  "Innovation distinguishes between a leader and a follower.",
  "Stay hungry, stay foolish.",
  "The future belongs to those who believe in the beauty of their dreams.",
]

export default function MessageOfTheDayWidget() {
  const [message, setMessage] = useState('')
  const containerRef = useRef(null)
  const [widgetHeight, setWidgetHeight] = useState(0)

  useEffect(() => {
    // Get message based on day of year for consistency
    const today = new Date()
    const startOfYear = new Date(today.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24))
    const messageIndex = dayOfYear % MESSAGES.length
    setMessage(MESSAGES[messageIndex])
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
  }

  const titleStyle = {
    fontSize: '1rem',
    fontWeight: 600,
    margin: 0,
    color: 'var(--color-canvas-text, #ffffff)',
    letterSpacing: '-0.01em',
    flexShrink: 0,
    display: showTitle ? 'block' : 'none'
  }

  const messageStyle = {
    fontSize: '0.875rem',
    lineHeight: 1.6,
    color: 'var(--color-canvas-text, #ffffff)',
    opacity: 0.85,
    margin: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    paddingRight: '4px',
    overflowY: 'auto',
  }

  return (
    <BaseWidget padding="1rem 0.75rem 1rem 1rem">
      <div ref={containerRef} style={containerStyle}>
        {showTitle && <h3 style={titleStyle}>Message of the Day</h3>}
        <p style={messageStyle}>{message}</p>
      </div>
    </BaseWidget>
  )
}

