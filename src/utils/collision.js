import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, WIDGET_PADDING, getWidgetMinSize } from '../constants/grid'
import { snapToGrid, snapSizeToGrid, constrainToViewport, constrainSizeToViewport } from './grid'

// Check if two rectangles overlap
export const checkCollision = (rect1, rect2) => {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  )
}

// Check if a rectangle collides with any widget (excluding the active widget)
export const hasCollisionWithOthers = (rect, widgets, excludeId) => {
  for (const widget of widgets) {
    if (widget.id === excludeId) continue
    const otherRect = {
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height
    }
    if (checkCollision(rect, otherRect)) {
      return true
    }
  }
  return false
}

// Find nearest valid position for a widget (spiral search from desired position)
export const findNearestValidPosition = (desiredX, desiredY, width, height, widgets, excludeId) => {
  const snappedX = snapToGrid(desiredX, GRID_OFFSET_X)
  const snappedY = snapToGrid(desiredY, GRID_OFFSET_Y)
  
  // Constrain to viewport first
  const constrained = constrainToViewport(snappedX, snappedY, width, height)
  let constrainedX = constrained.x
  let constrainedY = constrained.y
  
  // Check if constrained position is valid
  const constrainedRect = { x: constrainedX, y: constrainedY, width, height }
  if (!hasCollisionWithOthers(constrainedRect, widgets, excludeId)) {
    return { x: constrainedX, y: constrainedY }
  }
  
  // Spiral search: try positions in expanding grid pattern
  const maxRadius = 20 // Maximum grid units to search
  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        // Only check positions on the edge of the current radius
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue
        
        const testX = snappedX + (dx * GRID_SIZE)
        const testY = snappedY + (dy * GRID_SIZE)
        
        // Constrain to viewport
        const constrained = constrainToViewport(testX, testY, width, height)
        const testRect = { x: constrained.x, y: constrained.y, width, height }
        
        if (!hasCollisionWithOthers(testRect, widgets, excludeId)) {
          return { x: constrained.x, y: constrained.y }
        }
      }
    }
  }
  
  // If no valid position found, return constrained original position
  return { x: constrainedX, y: constrainedY }
}

// Find valid size that doesn't cause collision (reduce size incrementally)
// minWidth and minHeight are content-based minimums
export const findValidSize = (desiredX, desiredY, desiredWidth, desiredHeight, widgets, excludeId, originalWidth, originalHeight, minWidth = 0, minHeight = 0) => {
  const snappedWidth = snapSizeToGrid(desiredWidth)
  const snappedHeight = snapSizeToGrid(desiredHeight)
  
  // Ensure we don't go below content-based minimum
  const finalMinWidth = Math.max(minWidth, (1 * GRID_SIZE) - (WIDGET_PADDING * 2))
  const finalMinHeight = Math.max(minHeight, (1 * GRID_SIZE) - (WIDGET_PADDING * 2))
  
  // Check if snapped size is valid
  const snappedRect = { x: desiredX, y: desiredY, width: snappedWidth, height: snappedHeight }
  if (!hasCollisionWithOthers(snappedRect, widgets, excludeId) && snappedWidth >= finalMinWidth && snappedHeight >= finalMinHeight) {
    return { width: snappedWidth, height: snappedHeight }
  }
  
  // Try reducing size incrementally, but not below minimum
  // Try reducing width first
  const minGridUnitsWidth = Math.ceil((finalMinWidth + WIDGET_PADDING * 2) / GRID_SIZE)
  for (let gridUnits = Math.floor((snappedWidth + WIDGET_PADDING * 2) / GRID_SIZE) - 1; 
       gridUnits >= minGridUnitsWidth; 
       gridUnits--) {
    const testWidth = (gridUnits * GRID_SIZE) - (WIDGET_PADDING * 2)
    const testRect = { x: desiredX, y: desiredY, width: testWidth, height: snappedHeight }
    if (!hasCollisionWithOthers(testRect, widgets, excludeId)) {
      return { width: testWidth, height: snappedHeight }
    }
  }
  
  // Try reducing height
  const minGridUnitsHeight = Math.ceil((finalMinHeight + WIDGET_PADDING * 2) / GRID_SIZE)
  for (let gridUnits = Math.floor((snappedHeight + WIDGET_PADDING * 2) / GRID_SIZE) - 1; 
       gridUnits >= minGridUnitsHeight; 
       gridUnits--) {
    const testHeight = (gridUnits * GRID_SIZE) - (WIDGET_PADDING * 2)
    const testRect = { x: desiredX, y: desiredY, width: snappedWidth, height: testHeight }
    if (!hasCollisionWithOthers(testRect, widgets, excludeId)) {
      return { width: snappedWidth, height: testHeight }
    }
  }
  
  // Try reducing both
  for (let wGridUnits = Math.floor((snappedWidth + WIDGET_PADDING * 2) / GRID_SIZE) - 1; 
       wGridUnits >= minGridUnitsWidth; 
       wGridUnits--) {
    for (let hGridUnits = Math.floor((snappedHeight + WIDGET_PADDING * 2) / GRID_SIZE) - 1; 
         hGridUnits >= minGridUnitsHeight; 
         hGridUnits--) {
      const testWidth = (wGridUnits * GRID_SIZE) - (WIDGET_PADDING * 2)
      const testHeight = (hGridUnits * GRID_SIZE) - (WIDGET_PADDING * 2)
      const testRect = { x: desiredX, y: desiredY, width: testWidth, height: testHeight }
      if (!hasCollisionWithOthers(testRect, widgets, excludeId)) {
        return { width: testWidth, height: testHeight }
      }
    }
  }
  
  // If no valid size found, revert to original
  return { width: originalWidth, height: originalHeight }
}

