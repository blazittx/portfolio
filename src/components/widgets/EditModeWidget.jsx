import BaseWidget from './BaseWidget'

/* eslint-disable react/prop-types */
// Move / arrange layout icon (four-way arrows)
const MoveIcon = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14M7.05 7.05l9.9 9.9M16.95 7.05l-9.9 9.9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function EditModeWidget({ editModeOn, onEditModeToggle }) {
  const trackStyle = {
    width: '100%',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  }
  const buttonStyle = {
    flexShrink: 0,
    width: 48,
    height: 48,
    borderRadius: '10px',
    border: `1px solid ${editModeOn ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`,
    background: editModeOn ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
    color: 'var(--color-canvas-text, #ffffff)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: editModeOn ? 1 : 0.8,
  }

  return (
    <BaseWidget padding="0.5rem">
      <div style={trackStyle}>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => onEditModeToggle?.()}
          title={editModeOn ? 'Edit mode on – drag/resize widgets' : 'Toggle edit mode (or hold Ctrl)'}
        >
          <MoveIcon size={28} />
        </button>
      </div>
    </BaseWidget>
  )
}
