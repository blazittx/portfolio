import BaseWidget from '../BaseWidget'

/* eslint-disable react/prop-types */

export default function GameDetailsWidget({ game }) {
  return (
    <BaseWidget padding="1rem">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '0.75rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          margin: 0,
          letterSpacing: '-0.01em',
          color: 'canvasText',
          flexShrink: 0
        }}>Details</h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          flex: 1
        }}>
          {game.difficulty && (
            <div style={{
              fontSize: '0.875rem',
              color: 'canvasText',
              opacity: 0.8
            }}>
              <span style={{ opacity: 0.6 }}>Difficulty: </span>
              <span style={{ textTransform: 'capitalize' }}>{game.difficulty}</span>
            </div>
          )}
          {(game.minPlayers || game.maxPlayers) && (
            <div style={{
              fontSize: '0.875rem',
              color: 'canvasText',
              opacity: 0.8
            }}>
              <span style={{ opacity: 0.6 }}>Players: </span>
              <span>
                {game.minPlayers && game.maxPlayers 
                  ? `${game.minPlayers}-${game.maxPlayers}`
                  : game.minPlayers || game.maxPlayers || 'N/A'}
              </span>
            </div>
          )}
          {game.githubRepo && (
            <a
              href={game.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.875rem',
                color: 'canvasText',
                opacity: 0.8,
                textDecoration: 'none',
                marginTop: '0.5rem',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.8'
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              View on GitHub →
            </a>
          )}
        </div>
      </div>
    </BaseWidget>
  )
}

