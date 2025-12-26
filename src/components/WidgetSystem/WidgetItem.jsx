import { Component, useEffect, useRef } from 'react'

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
  allWidgets,
  isDragging, 
  isResizing, 
  hasCollision,
  isSwapTarget,
  isDraggingOverSwapTarget,
  onMouseDown,
  wasLastInteractionDrag,
  onGameClick,
  onUpdateWidgetSettings,
  onToggleProfilePictureExpand
}) {
  const widgetRef = useRef(null)
  const hasBeenAnimatedRef = useRef(false)

  // Add animation styles once
  useEffect(() => {
    if (!document.getElementById('widget-item-styles')) {
      const style = document.createElement('style')
      style.id = 'widget-item-styles'
      style.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        /* Widgets start with initial transform for GSAP animations */
        [data-widget-id] {
          transform-origin: center center;
          will-change: opacity, transform;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // Mark widget as animated once GSAP has animated it in
  useEffect(() => {
    if (widgetRef.current && !hasBeenAnimatedRef.current) {
      const checkInterval = setInterval(() => {
        const element = widgetRef.current
        if (element) {
          const opacity = window.getComputedStyle(element).opacity
          if (opacity === '1' || parseFloat(opacity) > 0.9) {
            hasBeenAnimatedRef.current = true
            clearInterval(checkInterval)
          }
        }
      }, 100)
      
      // Clear after 2 seconds max
      setTimeout(() => clearInterval(checkInterval), 2000)
    }
  }, [])

  const getWidgetStyle = () => {
    const baseStyle = {
      position: 'absolute',
      background: 'hsl(0 0% 4%)',
      border: hasCollision ? '2px solid #ff4444' : (isSwapTarget ? '1px solid rgba(74, 158, 255, 0.3)' : (widget.pinned ? '1px solid color-mix(in hsl, canvasText, transparent 55%)' : '1px solid #777777')),
      borderRadius: '4px',
      overflow: 'visible',
      transition: isDragging || isResizing ? 'none' : 'border-color 0.2s ease, box-shadow 0.2s ease, left 0.2s cubic-bezier(0.4, 0, 0.2, 1), top 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      // Disable CSS transitions for opacity/transform during GSAP animations
      willChange: isDragging || isResizing ? 'auto' : 'opacity, transform',
      cursor: widget.locked ? 'not-allowed' : 'move',
      userSelect: 'none',
      boxShadow: 'none',
      left: `${widget.x}px`,
      top: `${widget.y}px`,
      width: `${widget.width}px`,
      height: `${widget.height}px`,
      zIndex: (isDragging || isResizing) ? 1000 : (isSwapTarget ? 1001 : 'auto'),
      // Start invisible only if not already animated (prevents flash on new widgets)
      // Dim the dragged widget when hovering over a swap target
      opacity: hasBeenAnimatedRef.current ? (isDraggingOverSwapTarget ? 0.4 : (widget.locked ? 0.85 : 1)) : 0,
      visibility: hasBeenAnimatedRef.current ? 'visible' : 'hidden',
      transform: hasBeenAnimatedRef.current ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)'
    }
    
    if (hasCollision) {
      baseStyle.animation = 'shake 0.3s ease-in-out'
    }
    
    return baseStyle
  }

  const getWidgetContentStyle = () => ({
    overflow: 'hidden',
    borderRadius: '8px',
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0
  })

  const getResizeHandleStyle = (direction) => {
    const baseHandleStyle = {
      position: 'absolute',
      zIndex: 10,
      opacity: 0,
      transform: 'scale(0.8)',
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'all',
      background: 'transparent',
      cursor: 'default',
      display: widget.locked ? 'none' : 'block'
    }

    // Add white circle pseudo-element using a span
    const handleStyles = {
      n: { ...baseHandleStyle, top: '-20px', left: 0, right: 0, height: '40px', width: '100%', cursor: 'ns-resize', transform: 'scaleY(0.8)' },
      s: { ...baseHandleStyle, bottom: '-20px', left: 0, right: 0, height: '40px', width: '100%', cursor: 'ns-resize', transform: 'scaleY(0.8)' },
      e: { ...baseHandleStyle, right: '-20px', top: 0, bottom: 0, width: '40px', height: '100%', cursor: 'ew-resize', transform: 'scaleX(0.8)' },
      w: { ...baseHandleStyle, left: '-20px', top: 0, bottom: 0, width: '40px', height: '100%', cursor: 'ew-resize', transform: 'scaleX(0.8)' },
      ne: { ...baseHandleStyle, top: '-20px', right: '-20px', width: '40px', height: '40px', cursor: 'nesw-resize' },
      nw: { ...baseHandleStyle, top: '-20px', left: '-20px', width: '40px', height: '40px', cursor: 'nwse-resize' },
      se: { ...baseHandleStyle, bottom: '-20px', right: '-20px', width: '40px', height: '40px', cursor: 'nwse-resize' },
      sw: { ...baseHandleStyle, bottom: '-20px', left: '-20px', width: '40px', height: '40px', cursor: 'nesw-resize' }
    }

    return handleStyles[direction] || baseHandleStyle
  }

  const handleMouseEnter = (e) => {
    if (!widget.locked && !isDragging && !isResizing) {
      e.currentTarget.style.borderColor = 'color-mix(in hsl, canvasText, transparent 10%)'
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 12px color-mix(in hsl, canvasText, transparent 95%)'
    }
  }

  const handleMouseLeave = (e) => {
    if (!widget.locked && !isDragging && !isResizing) {
      e.currentTarget.style.borderColor = widget.pinned ? 'color-mix(in hsl, canvasText, transparent 55%)' : '#777777'
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }
  }

  const handleResizeHandleEnter = (e) => {
    e.currentTarget.style.opacity = '1'
    e.currentTarget.style.transform = 'scale(1)'
  }

  const handleResizeHandleLeave = (e) => {
    e.currentTarget.style.opacity = '0'
    e.currentTarget.style.transform = 'scale(0.8)'
  }

  const handleClick = (e) => {
    // Prevent default behavior to avoid page reloads when clicking on widget container
    // Only prevent if NOT clicking on interactive elements (links, buttons, etc.)
    const isInteractiveElement = e.target.closest('a, button, input, select, textarea, [role="button"]')
    if (!isInteractiveElement) {
      e.preventDefault()
    }
  }

  // Handle missing component gracefully
  if (!widget.component) {
    return (
      <div
        className="widget"
        style={getWidgetStyle()}
        data-widget-id={widget.id}
        onMouseDown={(e) => {
          if (!widget.locked) {
            onMouseDown(e, widget.id)
            e.currentTarget.style.cursor = 'grabbing'
          }
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={getWidgetContentStyle()}>
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
            Widget component not found
          </div>
        </div>
      </div>
    )
  }

  const Component = widget.component

  return (
    <div
      ref={widgetRef}
      className="widget"
      style={getWidgetStyle()}
      data-widget-id={widget.id}
      onMouseDown={(e) => {
        // Don't start dragging if clicking on interactive elements
        const isInteractiveElement = e.target.closest('input, textarea, select, button, a, [role="button"], [contenteditable="true"]')
        if (!widget.locked && !isInteractiveElement) {
          onMouseDown(e, widget.id)
          e.currentTarget.style.cursor = 'grabbing'
        }
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {widget.locked && (
        <div style={{
          position: 'absolute',
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
          right: '4px',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 1,
          color: 'var(--color-canvas-text, #ffffff)'
        }}>
          <PinIcon size={12} />
        </div>
      )}
      {isSwapTarget && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 1002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '1.25rem',
          fontWeight: 500,
          letterSpacing: '0.05em'
        }}>
          SWAP
        </div>
      )}
      <div style={getWidgetContentStyle()}>
        <WidgetErrorBoundary>
          <Component 
            widgetId={widget.id}
            wasLastInteractionDrag={wasLastInteractionDrag}
            onGameClick={onGameClick}
            widget={{
              ...widget,
              onSettingsChange: onUpdateWidgetSettings ? (settings) => onUpdateWidgetSettings(widget.id, settings) : undefined,
              onToggleExpand: onToggleProfilePictureExpand ? () => onToggleProfilePictureExpand(widget.id) : undefined
            }}
            allWidgets={allWidgets}
          />
        </WidgetErrorBoundary>
      </div>
      {/* Resize handles */}
      {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(direction => (
        <div
          key={direction}
          style={getResizeHandleStyle(direction)}
          data-handle={direction}
          onMouseEnter={handleResizeHandleEnter}
          onMouseLeave={handleResizeHandleLeave}
        >
          <span style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'white',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none'
          }}></span>
        </div>
      ))}
    </div>
  )
}

