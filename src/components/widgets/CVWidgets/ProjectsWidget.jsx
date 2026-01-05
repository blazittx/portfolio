import BaseWidget from '../BaseWidget'
import { useEffect, useRef, useState } from 'react'

/* eslint-disable react/prop-types */
export default function ProjectsWidget({ widget }) {
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

  // Default projects data - can be customized via widget settings
  const projects = widget?.settings?.projects || [
    {
      name: 'Gamble With Your Friends',
      role: 'Game Programmer',
      tech: 'Multiplayer Casino Game (not real money xd) • TENSTACK',
      description: ''
    },
    {
      name: 'Pullback Racers',
      role: 'Game Programmer',
      tech: 'Multiplayer Racing Party Game • TENSTACK',
      description: ''
    },
    {
      name: 'Bubbledome',
      role: 'Game Programmer',
      tech: 'Local Co-Op Party Brawler • GGJ 25',
      description: 'Implementation of the bubble shooting mechanic. Setting up and maintaining a CI/CD pipeline. Implementing the random generated maps logic. Integrating visual effects to game events. Integrated FMOD into the project for setting up game sounds. Setting up a party game camera system.'
    },
    {
      name: 'Forgekeepers',
      role: 'Solo Developer',
      tech: 'Roguelite Bullet Hell',
      description: 'Started building Forgekeepers as a student project in Futuregames. Setting up and maintaining a CI/CD pipeline. Created all gameplay systems from scratch as a solo developer. Learned about creating responsive User Interfaces in the Unity engine. Worked on visual effects and optimization systems.'
    },
    {
      name: 'PALS & FJÄDER',
      role: 'Product Owner',
      tech: 'Local Co-Op Adventure Game • Futuregames GP1',
      description: 'Coordinated a 14-person cross-functional team as the Product Owner. Set up a dynamic scoring system and online leaderboard using a raspberry pi. Developed prototypes for the initial setup project which accelerated our development greatly.'
    },
    {
      name: 'G.F.O.S 1992',
      role: 'Game Programmer',
      tech: 'Local Co-Op Puzzle Game • MAUJAM 2024',
      description: 'Programmed zero-gravity mechanics for puzzle-based gameplay. Developed hand-controlled interactions for precise movement. Delivered an immersive astronaut experience through advanced physics. Developed in 48 hours for MAUJAM 2024.'
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

  const getNameStyle = () => ({
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

  const getTechStyle = () => ({
    fontSize: sizeClass.includes('very-short') ? '0.6875rem' : sizeClass.includes('short') ? '0.75rem' : '0.8125rem',
    color: 'canvasText',
    opacity: 0.6,
    margin: '0 0 0.375rem 0',
    fontStyle: 'italic'
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
        <h3 style={getH3Style()}>Projects</h3>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {projects.map((project, index) => (
            <div key={index} style={index < projects.length - 1 ? getItemStyle() : {}}>
              <div style={getNameStyle()}>{project.name}</div>
              <div style={getRoleStyle()}>{project.role}</div>
              <div style={getTechStyle()}>{project.tech}</div>
              {project.description && <div style={getDescriptionStyle()}>{project.description}</div>}
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  )
}

