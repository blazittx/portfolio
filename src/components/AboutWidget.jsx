/* eslint-disable react/no-unescaped-entities */
import BaseWidget from './BaseWidget'
import { useEffect, useRef, useState } from 'react'

export default function AboutWidget() {
  const containerRef = useRef(null)
  const [sizeClass, setSizeClass] = useState('')

  useEffect(() => {
    const updateSizeClass = () => {
      if (!containerRef.current) return
      const { height } = containerRef.current.getBoundingClientRect()
      const isShort = height < 150
      const isVeryShort = height < 100
      let classes = []
      if (isShort) classes.push('short')
      if (isVeryShort) classes.push('very-short')
      setSizeClass(classes.join(' '))
    }
    updateSizeClass()
    const resizeObserver = new ResizeObserver(updateSizeClass)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [])

  const getH3Style = () => {
    const base = {
      fontSize: '1.125rem',
      fontWeight: 600,
      margin: '0 0 auto 0',
      letterSpacing: '-0.01em',
      color: 'canvasText',
      flexShrink: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      paddingRight: '4px',
      display: sizeClass.includes('short') || sizeClass.includes('very-short') ? 'none' : 'block'
    }
    return base
  }

  const getPStyle = () => {
    const base = {
      fontSize: '0.9375rem',
      lineHeight: 1.7,
      opacity: 0.6,
      color: 'canvasText',
      margin: 0,
      flex: 1,
      minHeight: 0,
      overflow: 'auto',
      overflowWrap: 'break-word',
      wordWrap: 'break-word',
      paddingRight: 0,
      marginRight: 0,
      width: '100%',
      maxWidth: '100%',
      display: 'block' // Always visible
    }
    if (sizeClass.includes('short')) {
      base.fontSize = '0.875rem'
      base.lineHeight = 1.5
    }
    if (sizeClass.includes('very-short')) {
      base.fontSize = '0.8125rem'
      base.lineHeight = 1.4
    }
    return base
  }

  return (
    <BaseWidget padding="1rem">
      <div 
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'stretch'
        }}
      >
        <h3 style={getH3Style()}>About</h3>
        <p style={getPStyle()}>
          I'm a game programmer with a passion for creating immersive and engaging multiplayer games.
        </p>
      </div>
    </BaseWidget>
  )
}

