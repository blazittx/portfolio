import { Component } from 'react'
import './WidgetItem.css'

/* eslint-disable react/prop-types */

// Pin Icon SVG Component
const PinIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.1689 23.1693C19.5514 23.7703 19.2153 24.5815 19.2153 25.4473C19.2153 26.3132 19.5514 27.1244 20.1689 27.7254L17.6606 30.2335L10.9669 23.5236L2.50829 32L0 29.4918L8.47682 21.0337L1.76657 14.3403L4.27486 11.8322C5.4934 13.0506 7.61261 13.0506 8.83115 11.8322L20.6805 0L32 11.3189L20.1672 23.1676L20.1689 23.1693Z" fill={color}/>
  </svg>
)

// Lock Icon SVG Component
const LockIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 27 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 0C8.5275 0 4.5 4.09143 4.5 9.14286V13.7143H0V32H27V13.7143H22.5V9.14286C22.5 4.09143 18.4725 0 13.5 0ZM13.5 4.57143C16.1775 4.57143 18 6.42286 18 9.14286V13.7143H9V9.14286C9 6.42286 10.8225 4.57143 13.5 4.57143Z" fill={color}/>
  </svg>
)

// Error boundary component for individual widgets
class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Widget error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '1rem',
          color: 'var(--color-canvas-text, #ffffff)',
          opacity: 0.6,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center'
        }}>
          Widget unavailable
        </div>
      )
    }

    return this.props.children
  }
}

export default function WidgetItem({ 
  widget, 
  isDragging, 
  isResizing, 
  hasCollision, 
  onMouseDown 
}) {
  // Handle missing component gracefully
  if (!widget.component) {
    return (
      <div
        className={`widget ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${hasCollision ? 'collision' : ''} ${widget.locked ? 'locked' : ''} ${widget.pinned ? 'pinned' : ''}`}
        style={{
          left: `${widget.x}px`,
          top: `${widget.y}px`,
          width: `${widget.width}px`,
          height: `${widget.height}px`
        }}
        data-widget-id={widget.id}
        onMouseDown={(e) => onMouseDown(e, widget.id)}
      >
        <div className="widget-content" style={{
          padding: '1rem',
          color: 'var(--color-canvas-text, #ffffff)',
          opacity: 0.6,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center'
        }}>
          Widget component not found
        </div>
      </div>
    )
  }

  const Component = widget.component

  return (
    <div
      className={`widget ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${hasCollision ? 'collision' : ''} ${widget.locked ? 'locked' : ''} ${widget.pinned ? 'pinned' : ''}`}
      style={{
        left: `${widget.x}px`,
        top: `${widget.y}px`,
        width: `${widget.width}px`,
        height: `${widget.height}px`
      }}
      data-widget-id={widget.id}
      onMouseDown={(e) => onMouseDown(e, widget.id)}
    >
      {widget.locked && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 1,
          color: 'var(--color-canvas-text, #ffffff)'
        }}>
          <LockIcon size={12} />
        </div>
      )}
      {widget.pinned && !widget.locked && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 1,
          color: 'var(--color-canvas-text, #ffffff)'
        }}>
          <PinIcon size={12} />
        </div>
      )}
      <div className="widget-content">
        <WidgetErrorBoundary>
          <Component />
        </WidgetErrorBoundary>
      </div>
      {/* Resize handles */}
      <div className="resize-handle resize-handle-n" data-handle="n"></div>
      <div className="resize-handle resize-handle-s" data-handle="s"></div>
      <div className="resize-handle resize-handle-e" data-handle="e"></div>
      <div className="resize-handle resize-handle-w" data-handle="w"></div>
      <div className="resize-handle resize-handle-ne" data-handle="ne"></div>
      <div className="resize-handle resize-handle-nw" data-handle="nw"></div>
      <div className="resize-handle resize-handle-se" data-handle="se"></div>
      <div className="resize-handle resize-handle-sw" data-handle="sw"></div>
    </div>
  )
}

