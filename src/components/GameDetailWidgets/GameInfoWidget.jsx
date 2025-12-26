import BaseWidget from '../BaseWidget'

/* eslint-disable react/prop-types */

export default function GameInfoWidget({ game }) {
  const infoItems = []
  
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
  
  if (game.version) {
    infoItems.push(
      <div key="version" style={{
        fontSize: '0.8125rem',
        opacity: 0.6,
        color: 'canvasText',
        whiteSpace: 'nowrap'
      }}>
        Version: {game.version}
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
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          margin: 0,
          letterSpacing: '-0.02em',
          color: 'canvasText',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          minWidth: 0
        }}>{game.title}</h2>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '1.5rem',
          flex: 1,
          flexWrap: 'wrap',
          minWidth: 0
        }}>
          {infoItems.map((item, index) => (
            <div key={item.key || index} style={{ display: 'flex', alignItems: 'center' }}>
              {index > 0 && (
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

