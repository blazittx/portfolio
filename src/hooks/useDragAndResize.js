import { useState, useRef, useCallback } from 'react'
import { snapToGrid, snapSizeToGrid, constrainToViewport, constrainSizeToViewport, snapToGridConstrained } from '../utils/grid'
import { getWidgetMinSize } from '../constants/grid'
import { GRID_OFFSET_X, GRID_OFFSET_Y } from '../constants/grid'
import { hasCollisionWithOthers, findNearestValidPosition, findValidSize } from '../utils/collision'

export const useDragAndResize = (widgets, setWidgets) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [collisionWidgetId, setCollisionWidgetId] = useState(null)
  const dragStateRef = useRef({
    activeId: null,
    startX: 0,
    startY: 0,
    widgetStartX: 0,
    widgetStartY: 0,
    hasMoved: false, // Track if mouse actually moved (drag vs click)
    moveThreshold: 5 // Pixels to move before considering it a drag
  })
  const resizeStateRef = useRef({
    activeId: null,
    handle: null, // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
    startX: 0,
    startY: 0,
    widgetStartX: 0,
    widgetStartY: 0,
    widgetStartWidth: 0,
    widgetStartHeight: 0
  })

  const handleMouseDown = (e, id) => {
    if (e.button !== 0) return
    
    const widget = widgets.find(w => w.id === id)
    if (!widget) return
    
    // Don't allow dragging/resizing locked widgets
    if (widget.locked) return

    // Check if clicking on a resize handle
    const handle = e.target.dataset.handle
    if (handle) {
      resizeStateRef.current = {
        activeId: id,
        handle: handle,
        startX: e.clientX,
        startY: e.clientY,
        widgetStartX: widget.x,
        widgetStartY: widget.y,
        widgetStartWidth: widget.width,
        widgetStartHeight: widget.height
      }
      setIsResizing(true)
    } else {
      dragStateRef.current = {
        activeId: id,
        startX: e.clientX,
        startY: e.clientY,
        widgetStartX: widget.x,
        widgetStartY: widget.y,
        hasMoved: false,
        moveThreshold: 5
      }
      setIsDragging(true)
    }

    e.preventDefault()
    e.stopPropagation()
  }

  const handleMouseMove = useCallback((e) => {
    // Track if dragging has actually moved (for click vs drag detection)
    if (dragStateRef.current.activeId) {
      const deltaX = Math.abs(e.clientX - dragStateRef.current.startX)
      const deltaY = Math.abs(e.clientY - dragStateRef.current.startY)
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      if (distance > dragStateRef.current.moveThreshold) {
        dragStateRef.current.hasMoved = true
      }
    }

    // Handle resizing - allow free movement during resize
    if (resizeStateRef.current.activeId) {
      const { handle, startX, startY, widgetStartX, widgetStartY, widgetStartWidth, widgetStartHeight } = resizeStateRef.current
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      setWidgets(prev => {
        const activeWidget = prev.find(w => w.id === resizeStateRef.current.activeId)
        if (!activeWidget) return prev

        let newX = widgetStartX
        let newY = widgetStartY
        let newWidth = widgetStartWidth
        let newHeight = widgetStartHeight

        // Handle horizontal resizing
        if (handle.includes('e')) {
          newWidth = widgetStartWidth + deltaX
        } else if (handle.includes('w')) {
          newWidth = widgetStartWidth - deltaX
          newX = widgetStartX + deltaX
        }

        // Handle vertical resizing
        if (handle.includes('s')) {
          newHeight = widgetStartHeight + deltaY
        } else if (handle.includes('n')) {
          newHeight = widgetStartHeight - deltaY
          newY = widgetStartY + deltaY
        }

        // Allow resizing below minimum during drag - we'll validate on mouse up
        // Constrain size to viewport (no minimum enforced during resize)
        const constrainedSize = constrainSizeToViewport(newX, newY, newWidth, newHeight)
        newWidth = constrainedSize.width
        newHeight = constrainedSize.height

        // Constrain position to viewport (in case resize moved it out)
        const constrainedPos = constrainToViewport(newX, newY, newWidth, newHeight)
        newX = constrainedPos.x
        newY = constrainedPos.y

        // Allow free movement during resize - no collision checking
        return prev.map(w => 
          w.id === activeWidget.id
            ? { ...w, x: newX, y: newY, width: newWidth, height: newHeight }
            : w
        )
      })
      return
    }

    // Handle dragging - allow free movement during drag, but constrain to viewport
    if (dragStateRef.current.activeId) {
      const { startX, startY, widgetStartX, widgetStartY } = dragStateRef.current
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      setWidgets(prev => {
        const activeWidget = prev.find(w => w.id === dragStateRef.current.activeId)
        if (!activeWidget) return prev

        let newX = widgetStartX + deltaX
        let newY = widgetStartY + deltaY

        // Constrain to viewport
        const constrained = constrainToViewport(newX, newY, activeWidget.width, activeWidget.height)
        
        return prev.map(w => 
          w.id === activeWidget.id
            ? { ...w, x: constrained.x, y: constrained.y }
            : w
        )
      })
    }
  }, [setWidgets])

  const handleMouseUp = useCallback(() => {
    // Clear collision state
    setCollisionWidgetId(null)
    
    // Check if it was a drag or click (for widgets that need to differentiate)
    let wasDrag = false
    if (dragStateRef.current.activeId) {
      wasDrag = dragStateRef.current.hasMoved
    }
    
    // Handle resize end
    if (resizeStateRef.current.activeId) {
      const activeId = resizeStateRef.current.activeId
      setIsResizing(false)
      
      // Snap widget position and size to grid
      setWidgets(prev => {
        const widget = prev.find(w => w.id === activeId)
        if (widget) {
          const { handle, widgetStartX, widgetStartY, widgetStartWidth, widgetStartHeight } = resizeStateRef.current
          const snappedWidth = snapSizeToGrid(widget.width)
          const snappedHeight = snapSizeToGrid(widget.height)
          
          // Calculate final position based on which handle was used
          let finalX = widget.x
          let finalY = widget.y
          
          if (handle.includes('w')) {
            // Resizing from left: adjust x position
            const widthChange = snappedWidth - widgetStartWidth
            finalX = widgetStartX - widthChange
          } else {
            // Resizing from right: keep x as is
            finalX = widget.x
          }
          
          if (handle.includes('n')) {
            // Resizing from top: adjust y position
            const heightChange = snappedHeight - widgetStartHeight
            finalY = widgetStartY - heightChange
          } else {
            // Resizing from bottom: keep y as is
            finalY = widget.y
          }
          
          // Snap final position to grid
          finalX = snapToGrid(finalX, GRID_OFFSET_X)
          finalY = snapToGrid(finalY, GRID_OFFSET_Y)
          
          // Get content-based minimum size for this widget type
          const minSize = getWidgetMinSize(widget.type || widget.id)
          const minWidth = snapSizeToGrid(minSize.width)
          const minHeight = snapSizeToGrid(minSize.height)
          
          // Check if size is below content-based minimum
          let needsSizeCorrection = false
          let correctedWidth = snappedWidth
          let correctedHeight = snappedHeight
          
          if (snappedWidth < minWidth || snappedHeight < minHeight) {
            needsSizeCorrection = true
            correctedWidth = Math.max(snappedWidth, minWidth)
            correctedHeight = Math.max(snappedHeight, minHeight)
            
            // Adjust position if resizing from left or top
            if (handle.includes('w')) {
              const widthChange = correctedWidth - snappedWidth
              finalX = finalX - widthChange
            }
            if (handle.includes('n')) {
              const heightChange = correctedHeight - snappedHeight
              finalY = finalY - heightChange
            }
            
            // Re-snap position after correction
            finalX = snapToGrid(finalX, GRID_OFFSET_X)
            finalY = snapToGrid(finalY, GRID_OFFSET_Y)
          }
          
          // Constrain size to viewport (with content-based minimum)
          const constrainedSize = constrainSizeToViewport(finalX, finalY, correctedWidth, correctedHeight, minWidth, minHeight)
          const finalWidth = constrainedSize.width
          const finalHeight = constrainedSize.height
          
          // Constrain position to viewport and ensure it's on grid
          const snappedPos = snapToGridConstrained(finalX, finalY, finalWidth, finalHeight, GRID_OFFSET_X, GRID_OFFSET_Y)
          finalX = snappedPos.x
          finalY = snappedPos.y
          
          // Show collision/shake animation if size was corrected
          if (needsSizeCorrection) {
            setCollisionWidgetId(activeId)
            setTimeout(() => setCollisionWidgetId(null), 300)
          }
          
          // Check for collisions and find valid size if needed
          const finalRect = {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight
          }
          
          if (hasCollisionWithOthers(finalRect, prev, activeId)) {
            // Try to find a valid size (reduce if needed, but respect minimum)
            const validSize = findValidSize(
              finalX, 
              finalY, 
              finalWidth, 
              finalHeight, 
              prev, 
              activeId,
              widgetStartWidth,
              widgetStartHeight,
              minWidth,
              minHeight
            )
            
            // Constrain valid size to viewport (with content-based minimum)
            const constrainedValidSize = constrainSizeToViewport(finalX, finalY, validSize.width, validSize.height, minWidth, minHeight)
            validSize.width = constrainedValidSize.width
            validSize.height = constrainedValidSize.height
            
            // Show collision feedback if size was reduced
            if (validSize.width !== finalWidth || validSize.height !== finalHeight) {
              setCollisionWidgetId(activeId)
              setTimeout(() => setCollisionWidgetId(null), 300)
            }
            
            // If size was reduced, recalculate position if needed
            let adjustedX = finalX
            let adjustedY = finalY
            
            if (handle.includes('w')) {
              const widthChange = validSize.width - widgetStartWidth
              adjustedX = widgetStartX - widthChange
              adjustedX = snapToGrid(adjustedX, GRID_OFFSET_X)
            }
            
            if (handle.includes('n')) {
              const heightChange = validSize.height - widgetStartHeight
              adjustedY = widgetStartY - heightChange
              adjustedY = snapToGrid(adjustedY, GRID_OFFSET_Y)
            }
            
            // Constrain adjusted position to viewport and ensure it's on grid
            const snappedAdjustedPos = snapToGridConstrained(adjustedX, adjustedY, validSize.width, validSize.height, GRID_OFFSET_X, GRID_OFFSET_Y)
            adjustedX = snappedAdjustedPos.x
            adjustedY = snappedAdjustedPos.y
            
            // Check if adjusted position still has collision
            const adjustedRect = {
              x: adjustedX,
              y: adjustedY,
              width: validSize.width,
              height: validSize.height
            }
            
            if (hasCollisionWithOthers(adjustedRect, prev, activeId)) {
              // Try to find nearest valid position
              const validPos = findNearestValidPosition(
                adjustedX,
                adjustedY,
                validSize.width,
                validSize.height,
                prev,
                activeId
              )
              
              // Show collision feedback if position was moved
              if (validPos.x !== adjustedX || validPos.y !== adjustedY) {
                setCollisionWidgetId(activeId)
                setTimeout(() => setCollisionWidgetId(null), 300)
              }
              
              return prev.map(w => {
                if (w.id === activeId) {
                  return {
                    ...w,
                    x: validPos.x,
                    y: validPos.y,
                    width: validSize.width,
                    height: validSize.height
                  }
                }
                return w
              })
            }
            
            return prev.map(w => {
              if (w.id === activeId) {
                return {
                  ...w,
                  x: adjustedX,
                  y: adjustedY,
                  width: validSize.width,
                  height: validSize.height
                }
              }
              return w
            })
          }
          
          return prev.map(w => {
            if (w.id === activeId) {
              return {
                ...w,
                x: finalX,
                y: finalY,
                width: finalWidth,
                height: finalHeight
              }
            }
            return w
          })
        }
        return prev
      })
      resizeStateRef.current.activeId = null
    }

    // Handle drag end
    if (dragStateRef.current.activeId) {
      const activeId = dragStateRef.current.activeId
      setIsDragging(false)
      
      // Snap the widget to the grid and find nearest valid position if collision
      setWidgets(prev => {
        const widget = prev.find(w => w.id === activeId)
        if (widget) {
          // Use snapToGridConstrained to ensure widget stays on grid and within viewport
          const snapped = snapToGridConstrained(widget.x, widget.y, widget.width, widget.height, GRID_OFFSET_X, GRID_OFFSET_Y)
          let snappedX = snapped.x
          let snappedY = snapped.y
          
          // Check for collisions
          const snappedRect = {
            x: snappedX,
            y: snappedY,
            width: widget.width,
            height: widget.height
          }
          
          if (hasCollisionWithOthers(snappedRect, prev, activeId)) {
            // Find nearest valid position
            const validPos = findNearestValidPosition(
              snappedX,
              snappedY,
              widget.width,
              widget.height,
              prev,
              activeId
            )
            
            // Show collision feedback if position was moved
            if (validPos.x !== snappedX || validPos.y !== snappedY) {
              setCollisionWidgetId(activeId)
              setTimeout(() => setCollisionWidgetId(null), 300)
            }
            
            return prev.map(w => {
              if (w.id === activeId) {
                return {
                  ...w,
                  x: validPos.x,
                  y: validPos.y
                }
              }
              return w
            })
          }
          
          return prev.map(w => {
            if (w.id === activeId) {
              return {
                ...w,
                x: snappedX,
                y: snappedY
              }
            }
            return w
          })
        }
        return prev
      })
      const wasDrag = dragStateRef.current.hasMoved
      const widgetId = dragStateRef.current.activeId
      dragStateRef.current.activeId = null
      dragStateRef.current.hasMoved = false
      
      // Store result for widgets to check
      dragStateRef.current.lastWasDrag = wasDrag
      dragStateRef.current.lastWidgetId = widgetId
    }
  }, [setWidgets])

  // Helper to check if the last interaction was a drag
  const wasLastInteractionDrag = useCallback((widgetId) => {
    return dragStateRef.current.lastWasDrag === true && dragStateRef.current.lastWidgetId === widgetId
  }, [])

  return {
    isDragging,
    isResizing,
    collisionWidgetId,
    dragStateRef,
    resizeStateRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    wasLastInteractionDrag
  }
}

