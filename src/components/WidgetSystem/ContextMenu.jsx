import './ContextMenu.css'
import { componentMap } from '../../hooks/useWidgets'
import { WIDGET_INFO } from '../../utils/widgets'

/* eslint-disable react/prop-types */

// Pin Icon SVG Component
const PinIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.1689 23.1693C19.5514 23.7703 19.2153 24.5815 19.2153 25.4473C19.2153 26.3132 19.5514 27.1244 20.1689 27.7254L17.6606 30.2335L10.9669 23.5236L2.50829 32L0 29.4918L8.47682 21.0337L1.76657 14.3403L4.27486 11.8322C5.4934 13.0506 7.61261 13.0506 8.83115 11.8322L20.6805 0L32 11.3189L20.1672 23.1676L20.1689 23.1693Z" fill={color}/>
  </svg>
)

// Lock Icon SVG Component
const LockIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 27 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 0C8.5275 0 4.5 4.09143 4.5 9.14286V13.7143H0V32H27V13.7143H22.5V9.14286C22.5 4.09143 18.4725 0 13.5 0ZM13.5 4.57143C16.1775 4.57143 18 6.42286 18 9.14286V13.7143H9V9.14286C9 6.42286 10.8225 4.57143 13.5 4.57143Z" fill={color}/>
  </svg>
)

export default function ContextMenu({ contextMenu, widgets, onToggleLock, onTogglePin, onRemoveWidget, onSort, onAddWidget, onClose }) {
  if (!contextMenu) return null

  const widget = contextMenu.widgetId ? widgets.find(w => w.id === contextMenu.widgetId) : null

  // Get available widget types
  const availableWidgetTypes = Object.keys(componentMap)
  
  // Get widgets currently on the grid
  const existingWidgetTypes = new Set(widgets.map(w => w.type || w.id))
  
  // Find missing widgets
  const missingWidgets = availableWidgetTypes
    .filter(type => !existingWidgetTypes.has(type))
    .map(type => ({
      type,
      name: WIDGET_INFO[type]?.name || type,
      icon: WIDGET_INFO[type]?.icon || '📦'
    }))

  return (
    <div 
      className="context-menu"
      style={{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {widget && (
        <>
          <button
            className="context-menu-item"
            onClick={() => {
              onTogglePin(contextMenu.widgetId)
              onClose()
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PinIcon size={16} />
            <span>{widget.pinned ? 'Unpin' : 'Pin'}</span>
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              onToggleLock(contextMenu.widgetId)
              onClose()
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <LockIcon size={16} />
            <span>{widget.locked ? 'Unlock' : 'Lock'}</span>
          </button>
          <div className="context-menu-divider"></div>
          <button
            className="context-menu-item context-menu-item-danger"
            onClick={() => {
              onRemoveWidget(contextMenu.widgetId)
              onClose()
            }}
          >
            🗑️ Remove
          </button>
        </>
      )}
      {missingWidgets.length > 0 && (
        <>
          {widget && <div className="context-menu-divider"></div>}
          <div className="context-menu-section">Add Widget</div>
          {missingWidgets.map(({ type, name, icon }) => (
            <button
              key={type}
              className="context-menu-item"
              onClick={() => {
                onAddWidget(type, contextMenu.x, contextMenu.y)
                onClose()
              }}
            >
              {icon} {name}
            </button>
          ))}
        </>
      )}
      {(widget || missingWidgets.length > 0) && <div className="context-menu-divider"></div>}
      <button
        className="context-menu-item"
        onClick={() => {
          onSort()
          onClose()
        }}
      >
        ↻ Sort
      </button>
    </div>
  )
}

