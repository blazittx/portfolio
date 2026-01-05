import { useMemo } from 'react'
import BaseWidget from '../BaseWidget'
import { getTeamMembers } from '../../../data/gameDevelopmentInfo'

/* eslint-disable react/prop-types */

export default function GameDetailsWidget({ game }) {
  const teamMembers = useMemo(() => {
    if (!game?.id) return null
    return getTeamMembers(game.id)
  }, [game?.id])

  if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
    return (
      <BaseWidget padding="0.75rem 1rem">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'canvasText',
          opacity: 0.5,
          fontSize: '0.875rem'
        }}>
          No team members available
        </div>
      </BaseWidget>
    )
  }

  return (
    <BaseWidget padding="0.75rem 1rem">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        height: '100%',
        gap: '0.75rem',
        overflowY: 'auto',
        alignContent: 'start'
      }}>
        {teamMembers.map((member, index) => {
          // Support both old format (string) and new format (object)
          const name = typeof member === 'string' ? member : member.name
          const role = typeof member === 'object' && member.role ? member.role : null
          const linkedin = typeof member === 'object' && member.linkedin ? member.linkedin : null

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {linkedin ? (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'canvasText',
                      textDecoration: 'none',
                      opacity: 0.9,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.textDecoration = 'underline'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.9'
                      e.currentTarget.style.textDecoration = 'none'
                    }}
                  >
                    {name}
                  </a>
                ) : (
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'canvasText',
                    opacity: 0.9
                  }}>
                    {name}
                  </span>
                )}
              </div>
              {role && (
                <span style={{
                  fontSize: '0.75rem',
                  color: 'canvasText',
                  opacity: 0.6
                }}>
                  {role}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </BaseWidget>
  )
}



