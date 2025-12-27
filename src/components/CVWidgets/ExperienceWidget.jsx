import BaseWidget from '../BaseWidget'
import { useEffect, useRef, useState } from 'react'

/* eslint-disable react/prop-types */
export default function ExperienceWidget({ widget }) {
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

  // Default experience data - can be customized via widget settings
  const experiences = widget?.settings?.experiences || [
    {
      company: 'TENSTACK',
      role: 'Game Programmer',
      period: 'Apr 2025 – Present',
      location: 'Sweden',
      description: "Worked on TENSTACK's first multiplayer game Pullback Racers. Set up networked game mechanics and UI systems. Currently working on Gamble With Your Friends, an unreleased game in development."
    },
    {
      company: 'Diabolical Studios',
      role: 'Co-Founder',
      period: 'Nov 2022 – Feb 2025',
      location: 'Turkey',
      description: 'Formed Diabolical Studios during university after several successful game jam collaborations. Led development on game jam titles, focusing on mechanics and AI systems under tight deadlines. Represented the studio in competitions, securing wins that helped fund larger, non-jam projects.'
    },
    {
      company: 'Jotform',
      role: 'UI Designer Intern',
      period: 'Jul 2023 – Aug 2023',
      location: 'Remote',
      description: 'Collaborated with a team of four interns to design recurring form systems under tight deadlines. Created a calendar-based selection feature and a card-style "View Forms" tab for intuitive user flows. Earned "Best Enterprise Engineering Project" by enhancing user experience through continuous feedback and iteration.'
    },
    {
      company: 'Koçtaş',
      role: 'UX Designer Intern',
      period: 'Jan 2022 – Jun 2022',
      location: 'Turkey',
      description: 'Designed user-focused web interfaces, applying e-commerce UX principles for improved customer journeys. Worked closely with cross-functional teams to implement updates and meet project milestones. Expanded front-end skills (HTML, CSS, JavaScript) to prototype and refine features efficiently.'
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

  const getCompanyStyle = () => ({
    fontSize: sizeClass.includes('very-short') ? '0.8125rem' : sizeClass.includes('short') ? '0.875rem' : '0.9375rem',
    fontWeight: 600,
    color: 'canvasText',
    margin: '0 0 0.25rem 0'
  })

  const getRoleStyle = () => ({
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

  const getDescriptionStyle = () => ({
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
        <h3 style={getH3Style()}>Experience</h3>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {experiences.map((exp, index) => (
            <div key={index} style={index < experiences.length - 1 ? getItemStyle() : {}}>
              <div style={getCompanyStyle()}>{exp.company}</div>
              <div style={getRoleStyle()}>{exp.role}</div>
              <div style={getPeriodStyle()}>{exp.period}{exp.location ? ` • ${exp.location}` : ''}</div>
              {exp.description && <div style={getDescriptionStyle()}>{exp.description}</div>}
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  )
}

