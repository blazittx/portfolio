/* eslint-disable react/prop-types */
export default function AutosortButton({ onClick }) {
  return (
    <button 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'color-mix(in hsl, canvasText, transparent 95%)',
        border: '1px solid color-mix(in hsl, canvasText, transparent 6%)',
        borderRadius: '4px',
        color: 'canvasText',
        fontSize: '0.875rem',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        opacity: 0.7,
        transition: 'opacity 0.2s, transform 0.2s',
        fontFamily: 'inherit'
      }}
      onClick={onClick}
      title="Auto-sort widgets"
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.7'
        e.currentTarget.style.transform = 'scale(1)'
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
    >
      ↻ Sort
    </button>
  )
}

