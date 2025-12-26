import BaseWidget from '../BaseWidget'

/* eslint-disable react/prop-types */

export default function GameInfoWidget({ game }) {
  return (
    <BaseWidget padding="1.25rem">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '0.75rem'
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 600,
          margin: 0,
          letterSpacing: '-0.02em',
          color: 'canvasText',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{game.title}</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          opacity: 0.7,
          color: 'canvasText'
        }}>
          {game.teamIcon && (
            <img
              src={game.teamIcon}
              alt={game.tech}
              draggable="false"
              style={{
                width: '20px',
                height: '20px',
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
        {game.version && (
          <div style={{
            fontSize: '0.8125rem',
            opacity: 0.6,
            color: 'canvasText'
          }}>
            Version: {game.version}
          </div>
        )}
        {game.year && (
          <div style={{
            fontSize: '0.8125rem',
            opacity: 0.6,
            color: 'canvasText'
          }}>
            Year: {game.year}
          </div>
        )}
      </div>
    </BaseWidget>
  )
}

