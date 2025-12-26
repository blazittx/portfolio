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
  onGameClick
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
        zIndex: 1
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

