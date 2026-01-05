import { useEffect, useRef, useState } from 'react'
import BaseWidget from '../BaseWidget'

/* eslint-disable react/prop-types */

export default function GameInfoWidget({ game }) {
  const containerRef = useRef(null)
  const [sizeClass, setSizeClass] = useState('')
  const infoItems = []
  
  useEffect(() => {
    const updateSizeClass = () => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const isNarrow = width < 500
      const isShort = height < 150
      const isVeryShort = height < 100
      let classes = []
      if (isNarrow) classes.push('narrow')
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
  
  if (game.teamIcon || game.tech) {
    infoItems.push(
      <div key="tech" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        opacity: 0.7,
        color: 'canvasText',
        whiteSpace: 'nowrap'
      }}>
        {game.teamIcon && (
          <img
            src={game.teamIcon}
            alt={game.tech}
            draggable="false"
            loading="lazy"
            decoding="async"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '2px',
              objectFit: 'cover',
              flexShrink: 0,
              userSelect: 'none'
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}
        <span>{game.tech}</span>
      </div>
    )
  }
  
  if (game.year) {
    infoItems.push(
      <div key="year" style={{
        fontSize: '0.8125rem',
        opacity: 0.6,
        color: 'canvasText',
        whiteSpace: 'nowrap'
      }}>
        Year: {game.year}
      </div>
    )
  }

  const isNarrow = sizeClass.includes('narrow')

  return (
    <BaseWidget padding="0.25rem 1rem">
      <div 
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: isNarrow ? 'column' : 'row',
          alignItems: isNarrow ? 'center' : 'center',
          justifyContent: isNarrow ? 'center' : 'space-between',
          height: '100%',
          minHeight: '100%',
          gap: isNarrow ? '0.5rem' : '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          margin: 0,
          letterSpacing: '-0.02em',
          color: 'canvasText',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: isNarrow ? 'normal' : 'nowrap',
          flexShrink: 0,
          minWidth: 0,
          width: isNarrow ? '100%' : 'auto',
          textAlign: isNarrow ? 'center' : 'left'
        }}>{game.title}</h2>
        <div style={{
          display: 'flex',
          flexDirection: isNarrow ? 'column' : 'row',
          alignItems: isNarrow ? 'center' : 'center',
          justifyContent: isNarrow ? 'center' : 'flex-end',
          gap: isNarrow ? '0.5rem' : '1.5rem',
          flex: isNarrow ? '0 0 auto' : '0 0 auto',
          flexWrap: 'wrap',
          minWidth: 0,
          width: isNarrow ? '100%' : 'auto'
        }}>
          {infoItems.map((item, index) => (
            <div key={item.key || index} style={{ display: 'flex', alignItems: 'center' }}>
              {!isNarrow && index > 0 && (
                <span style={{
                  width: '1px',
                  height: '1rem',
                  backgroundColor: 'canvasText',
                  opacity: 0.2,
                  marginRight: '1.5rem'
                }} />
              )}
              {item}
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  )
}

