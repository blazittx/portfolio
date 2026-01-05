import WidgetItem from './WidgetItem'

/* eslint-disable react/prop-types */
export default function WidgetContainer({ 
  widgets, 
  isDragging, 
  isResizing, 
  collisionWidgetId,
  swapTargetId,
  dragStateRef, 
  resizeStateRef, 
  onMouseDown,
  wasLastInteractionDrag,
  onGameClick,
  onCVClick,
  centerOffset = { x: 0, y: 0 },
  onUpdateWidgetSettings
}) {
  // Ensure widgets is an array and filter out invalid widgets
  const validWidgets = Array.isArray(widgets) 
    ? widgets.filter(widget => widget && widget.id)
    : []

  const offsetX = centerOffset.x || 0
  const offsetY = centerOffset.y || 0
  const hasOffset = offsetX !== 0 || offsetY !== 0

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        zIndex: 1,
        transform: hasOffset ? `translate(${offsetX}px, ${offsetY}px)` : 'none',
        transition: (isDragging || isResizing) ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {validWidgets.map(widget => {
        try {
          const isDraggingWidget = isDragging && dragStateRef.current?.activeId === widget.id
          const isResizingWidget = isResizing && resizeStateRef.current?.activeId === widget.id
          const hasCollision = collisionWidgetId === widget.id
          const isSwapTarget = swapTargetId === widget.id
          const isDraggingOverSwapTarget = isDraggingWidget && swapTargetId !== null
          
          return (
            <WidgetItem
              key={widget.id}
              widget={widget}
              allWidgets={validWidgets}
              isDragging={isDraggingWidget}
              isResizing={isResizingWidget}
              hasCollision={hasCollision}
              isSwapTarget={isSwapTarget}
              isDraggingOverSwapTarget={isDraggingOverSwapTarget}
              onMouseDown={onMouseDown}
              wasLastInteractionDrag={wasLastInteractionDrag}
              onGameClick={onGameClick}
              onCVClick={onCVClick}
              onUpdateWidgetSettings={onUpdateWidgetSettings}
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

