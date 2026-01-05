import { useState, useEffect } from 'react'
import BaseWidget from './BaseWidget'

export default function TimeWidget() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '0.5rem',
    justifyContent: 'center',
    alignItems: 'center',
  }

  const timeStyle = {
    fontSize: '2rem',
    fontWeight: 600,
    margin: 0,
    color: 'var(--color-canvas-text, #ffffff)',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
  }

  const dateStyle = {
    fontSize: '0.75rem',
    color: 'var(--color-canvas-text, #ffffff)',
    opacity: 0.7,
    margin: 0,
    textAlign: 'center',
  }

  return (
    <BaseWidget padding="1rem">
      <div style={containerStyle}>
        <div style={timeStyle}>{formatTime(time)}</div>
        <div style={dateStyle}>{formatDate(time)}</div>
      </div>
    </BaseWidget>
  )
}



