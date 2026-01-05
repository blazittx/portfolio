import BaseWidget from '../BaseWidget'
import { useEffect, useRef, useState } from 'react'

/* eslint-disable react/prop-types */
export default function EducationWidget({ widget }) {
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

  // Default education data - can be customized via widget settings
  const education = widget?.settings?.education || [
    {
      institution: 'Futuregames Stockholm',
      degree: 'Game Programming',
      period: '2024 - Present'
    },
    {
      institution: 'Bahcesehir University',
      degree: 'Digital Game Design',
      period: '2020 - 2024',
      details: 'GPA 3.41'
    }
  ]

  const getH3Style = () => ({
    fontSize: sizeClass.includes('very-short') ? '0.9375rem' : sizeClass.includes('short') ? '1rem' : '1.125rem',
    fontWeight: 600,
    margin: '0 0 0.75rem 0',
    letterSpacing: '-0.01em',
    color: 'canvasText',
    flexShrink: 0,
    display: sizeClass.includes('very-short') ? 'none' : 'block'
  })

  const getItemStyle = () => ({
    marginBottom: sizeClass.includes('very-short') ? '0.5rem' : sizeClass.includes('short') ? '0.75rem' : '1rem',
    paddingBottom: sizeClass.includes('very-short') ? '0.5rem' : sizeClass.includes('short') ? '0.75rem' : '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  })

  const getInstitutionStyle = () => ({
    fontSize: sizeClass.includes('very-short') ? '0.8125rem' : sizeClass.includes('short') ? '0.875rem' : '0.9375rem',
    fontWeight: 600,
    color: 'canvasText',
    margin: '0 0 0.25rem 0'
  })

  const getDegreeStyle = () => ({
    fontSize: sizeClass.includes('very-short') ? '0.75rem' : sizeClass.includes('short') ? '0.8125rem' : '0.875rem',
    fontWeight: 500,
    color: 'canvasText',
    opacity: 0.8,
    margin: '0 0 0.25rem 0'
  })

  const getPeriodStyle = () => ({
    fontSize: sizeClass.includes('very-short') ? '0.6875rem' : sizeClass.includes('short') ? '0.75rem' : '0.8125rem',
    color: 'canvasText',
    opacity: 0.6,
    margin: '0 0 0.375rem 0'
  })

  const getDetailsStyle = () => ({
    fontSize: sizeClass.includes('very-short') ? '0.6875rem' : sizeClass.includes('short') ? '0.75rem' : '0.8125rem',
    lineHeight: 1.5,
    color: 'canvasText',
    opacity: 0.7,
    margin: 0,
    display: sizeClass.includes('very-short') ? 'none' : 'block'
  })

  return (
    <BaseWidget padding="1rem 0.75rem 1rem 1rem" style={{ gap: '0.75rem' }}>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}
      >
        <h3 style={getH3Style()}>Education</h3>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {education.map((edu, index) => (
            <div key={index} style={index < education.length - 1 ? getItemStyle() : {}}>
              <div style={getInstitutionStyle()}>{edu.institution}</div>
              <div style={getDegreeStyle()}>{edu.degree}</div>
              <div style={getPeriodStyle()}>{edu.period}</div>
              {edu.details && <div style={getDetailsStyle()}>{edu.details}</div>}
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  )
}

