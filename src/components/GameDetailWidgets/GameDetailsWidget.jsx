import BaseWidget from '../BaseWidget'

/* eslint-disable react/prop-types */

export default function GameDetailsWidget({ game }) {
  const details = []
  
  if (game.difficulty) {
    details.push(
      <div key="difficulty" style={{
        fontSize: '0.875rem',
        color: 'canvasText',
        opacity: 0.8,
        whiteSpace: 'nowrap'
      }}>
        <span style={{ opacity: 0.6 }}>Difficulty: </span>
        <span style={{ textTransform: 'capitalize' }}>{game.difficulty}</span>
      </div>
    )
  }
  
  if (game.minPlayers || game.maxPlayers) {
    details.push(
      <div key="players" style={{
        fontSize: '0.875rem',
        color: 'canvasText',
        opacity: 0.8,
        whiteSpace: 'nowrap'
      }}>
        <span style={{ opacity: 0.6 }}>Players: </span>
        <span>
          {game.minPlayers && game.maxPlayers 
            ? `${game.minPlayers}-${game.maxPlayers}`
            : game.minPlayers || game.maxPlayers || 'N/A'}
        </span>
      </div>
    )
  }
  
  if (game.githubRepo) {
    details.push(
      <a
        key="github"
        href={game.githubRepo}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: '0.875rem',
          color: 'canvasText',
          opacity: 0.8,
          textDecoration: 'none',
          whiteSpace: 'nowrap'
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
        GitHub →
      </a>
    )
  }

  return (
    <BaseWidget padding="0.75rem 1rem">
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          margin: 0,
          letterSpacing: '-0.01em',
          color: 'canvasText',
          opacity: 0.6,
          flexShrink: 0
        }}>Details</h3>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '1.5rem',
          flex: 1,
          flexWrap: 'wrap'
        }}>
          {details.map((detail, index) => (
            <div key={detail.key || index} style={{ display: 'flex', alignItems: 'center' }}>
              {index > 0 && (
                <span style={{
                  width: '1px',
                  height: '1rem',
                  backgroundColor: 'canvasText',
                  opacity: 0.2,
                  marginRight: '1.5rem'
                }} />
              )}
              {detail}
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  )
}



