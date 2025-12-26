import { WIDGET_PADDING } from '../../constants/grid'

export default function GridMask({ widgets }) {
  return (
    <>
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
              position: 'fixed',
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
    </>
  )
}

