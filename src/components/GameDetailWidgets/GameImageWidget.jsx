import BaseWidget from '../BaseWidget'

/* eslint-disable react/prop-types */

export default function GameImageWidget({ game }) {
  return (
    <BaseWidget padding="0.5rem">
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '4px',
        background: 'color-mix(in hsl, canvasText, transparent 98%)'
      }}>
        <img 
          src={game.image} 
          alt={game.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          loading="lazy"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/800x600?text=Game+Image";
          }}
        />
      </div>
    </BaseWidget>
  )
}

