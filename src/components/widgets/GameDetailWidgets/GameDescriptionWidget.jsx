import BaseWidget from '../BaseWidget'

/* eslint-disable react/prop-types */

export default function GameDescriptionWidget({ game }) {
  return (
    <BaseWidget padding="1rem">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          margin: '0 0 0.75rem 0',
          letterSpacing: '-0.01em',
          color: 'canvasText',
          flexShrink: 0
        }}>Description</h3>
        <p style={{
          fontSize: '0.9375rem',
          lineHeight: 1.7,
          opacity: 0.8,
          color: 'canvasText',
          margin: 0,
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          overflowWrap: 'break-word',
          paddingRight: 0
        }}>{game.description}</p>
      </div>
    </BaseWidget>
  )
}



