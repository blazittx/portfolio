import WidgetItem from './WidgetItem'

/* eslint-disable react/prop-types */
export default function WidgetContainer({ 
  widgets, 
  isDragging, 
  isResizing, 
  collisionWidgetId, 
  dragStateRef, 
  resizeStateRef, 
  onMouseDown,
  wasLastInteractionDrag,
  onGameClick,
  centerOffset = 0
}) {
  // Ensure widgets is an array and filter out invalid widgets
  const validWidgets = Array.isArray(widgets) 
    ? widgets.filter(widget => widget && widget.id)
    : []

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        zIndex: 1,
        transform: centerOffset !== 0 ? `translateX(${centerOffset}px)` : 'none',
        transition: (isDragging || isResizing) ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {validWidgets.map(widget => {
        try {
          const isDraggingWidget = isDragging && dragStateRef.current?.activeId === widget.id
          const isResizingWidget = isResizing && resizeStateRef.current?.activeId === widget.id
          const hasCollision = collisionWidgetId === widget.id
          
          return (
            <WidgetItem
              key={widget.id}
              widget={widget}
              isDragging={isDraggingWidget}
              isResizing={isResizingWidget}
              hasCollision={hasCollision}
              onMouseDown={onMouseDown}
              wasLastInteractionDrag={wasLastInteractionDrag}
              onGameClick={onGameClick}
            />
          )
        } catch (error) {
          console.error(`Error rendering widget ${widget.id}:`, error)
          return null
        }
      })}
    </div>
  )
}

