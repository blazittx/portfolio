import BaseWidget from './BaseWidget'
import { useEffect, useRef, useState } from 'react'
import { GRID_SIZE } from '../../constants/grid'

/* eslint-disable react/prop-types */
// SVG Icons
const EmailIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6L12 13L2 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const GitHubIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.865 20.335 8.839 21.489C9.339 21.579 9.521 21.272 9.521 21.008C9.521 20.761 9.512 19.97 9.507 19.072C6.726 19.688 6.14 17.92 6.14 17.92C5.685 16.758 5.029 16.488 5.029 16.488C4.121 15.901 5.097 15.916 5.097 15.916C6.101 15.99 6.629 16.955 6.629 16.955C7.521 18.341 8.97 17.936 9.539 17.684C9.631 17.001 9.889 16.536 10.175 16.303C7.954 16.006 5.619 15.187 5.619 11.437C5.619 10.36 6.01 9.463 6.649 8.765C6.546 8.505 6.203 7.483 6.747 6.211C6.747 6.211 7.586 5.94 9.496 7.306C10.295 7.076 11.15 6.962 12 6.958C12.85 6.962 13.705 7.076 14.504 7.306C16.414 5.94 17.253 6.211 17.253 6.211C17.797 7.483 17.454 8.505 17.351 8.765C17.99 9.463 18.381 10.36 18.381 11.437C18.381 15.197 16.038 16.006 13.812 16.303C14.171 16.608 14.494 17.148 14.494 17.988C14.494 19.223 14.481 20.219 14.481 21.008C14.481 21.275 14.66 21.585 15.166 21.489C19.135 20.335 22 16.418 22 12C22 6.477 17.523 2 12 2Z"/>
  </svg>
)

const LinkedInIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 9H2V21H6V9Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function ContactWidget() {
  const containerRef = useRef(null)
  const [widgetHeight, setWidgetHeight] = useState(0)

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
    gap: '1rem',
  }

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 600,
    margin: 0,
    color: 'var(--color-canvas-text, #ffffff)',
    letterSpacing: '-0.01em',
    flexShrink: 0,
    display: showTitle ? 'block' : 'none'
  }

  const linksContainerStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.75rem',
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  }

  const buttonStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: 'var(--color-canvas-text, #ffffff)',
    opacity: 0.7,
    padding: 0,
    textDecoration: 'none',
  }

  const contacts = [
    { 
      label: 'Email', 
      href: 'mailto:info@doruksasmaz.com',
      icon: (props) => <EmailIcon {...props} />
    },
    { 
      label: 'GitHub', 
      href: 'https://github.com/blazittx',
      icon: (props) => <GitHubIcon {...props} />
    },
    { 
      label: 'LinkedIn', 
      href: 'https://www.linkedin.com/in/doruksasmaz/',
      icon: (props) => <LinkedInIcon {...props} />
    },
  ]

  return (
    <BaseWidget padding="1rem 0.75rem 1rem 1rem">
      <div ref={containerRef} style={containerStyle}>
        {showTitle && <h3 style={titleStyle}>Contact</h3>}
        <div style={linksContainerStyle}>
          {contacts.map((contact, index) => {
            const IconComponent = contact.icon
            return (
              <a
                key={index}
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                style={buttonStyle}
                title={contact.label}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = 'scale(1.1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.7'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <IconComponent size={24} />
              </a>
            )
          })}
        </div>
      </div>
    </BaseWidget>
  )
}

