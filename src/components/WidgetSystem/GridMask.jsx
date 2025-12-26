import { WIDGET_PADDING } from '../../constants/grid'

/* eslint-disable react/prop-types */
export default function GridMask({ widgets, centerOffset = { x: 0, y: 0 }, isDragging = false, isResizing = false }) {
  const offsetX = centerOffset.x || 0
  const offsetY = centerOffset.y || 0
  const hasOffset = offsetX !== 0 || offsetY !== 0
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        transform: hasOffset ? `translate(${offsetX}px, ${offsetY}px)` : 'none',
        transition: (isDragging || isResizing) ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {widgets.map(widget => {
        // Calculate each side separately with WIDGET_PADDING
        const left = widget.x - WIDGET_PADDING
        const right = widget.x + widget.width + WIDGET_PADDING
        const top = widget.y - WIDGET_PADDING
        const bottom = widget.y + widget.height + WIDGET_PADDING
        
        return (
          <div
            key={`grid-mask-${widget.id}`}
            data-grid-mask-id={widget.id}
            style={{
              position: 'absolute',
              background: 'hsl(0 0% 4%)',
              pointerEvents: 'none',
              zIndex: 0,
              // Grow mask by WIDGET_PADDING (12px) on all sides to clear entire grid area
              left: `${left + 1}px`,
              top: `${top + 1}px`,
              width: `${right - left - 1}px`,
              height: `${bottom - top - 1}px`,
              // Start with opacity 0 to prevent flash, will be animated by GSAP
              // GSAP will animate this to 1 when widgets are created
              opacity: 0
            }}
          />
        )
      })}
    </div>
  )
}

