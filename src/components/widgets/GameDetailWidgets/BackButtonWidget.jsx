import BaseWidget from '../BaseWidget'

/* eslint-disable react/prop-types */

export default function BackButtonWidget({ onBack }) {
  const handleMouseDown = (e) => {
    // Stop propagation to prevent widget drag from starting
    e.stopPropagation()
  }

  const handleClick = (e) => {
    // Stop propagation
    e.stopPropagation()
    e.preventDefault()
    
    if (onBack) {
      onBack()
    }
  }

  return (
    <BaseWidget 
      padding="0"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: 'canvasText',
        opacity: 0.7,
        transition: 'opacity 0.2s',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        <span>←</span>
        <span>Back</span>
      </div>
    </BaseWidget>
  )
}



