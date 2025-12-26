import BaseWidget from './BaseWidget'
import { useEffect, useRef, useState } from 'react'

export default function ProfileWidget() {
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

  const getHeaderStyle = () => {
    const base = {
      marginBottom: 'auto',
      flexShrink: 0,
      minHeight: 'fit-content',
      paddingRight: '4px'
    }
    if (sizeClass.includes('short') || sizeClass.includes('very-short')) {
      base.marginBottom = sizeClass.includes('very-short') ? '0.5rem' : '0.75rem'
    }
    return base
  }

  const getH2Style = () => {
    const base = {
      fontSize: '1.75rem',
      fontWeight: 600,
      margin: '0 0 0.5rem 0',
      letterSpacing: '-0.02em',
      color: 'canvasText',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
    if (sizeClass.includes('short')) {
      base.fontSize = '1.5rem'
      base.marginBottom = '0.25rem'
    }
    if (sizeClass.includes('very-short')) {
      base.fontSize = '1.25rem'
    }
    return base
  }

  const getLabelStyle = () => {
    const base = {
      fontSize: '0.875rem',
      opacity: 0.5,
      color: 'canvasText',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
    if (sizeClass.includes('short') || sizeClass.includes('very-short')) {
      base.fontSize = '0.75rem'
    }
    return base
  }

  return (
    <BaseWidget padding="1.25rem">
      <div ref={containerRef} style={getHeaderStyle()}>
        <h2 style={getH2Style()}>Doruk Sasmaz</h2>
        <span style={getLabelStyle()}>Game Programmer</span>
      </div>
    </BaseWidget>
  )
}
