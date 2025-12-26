import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, WIDGET_PADDING } from '../constants/grid'

// Snap a coordinate to the nearest grid line with padding (inside the grid cell)
export const snapToGrid = (coord, offset) => {
  const adjusted = coord - offset
  const snapped = Math.round(adjusted / GRID_SIZE) * GRID_SIZE
  return snapped + offset + WIDGET_PADDING
}

// Snap a size to fit within grid cells (accounting for padding on both sides)
// Size should be: (grid_units * GRID_SIZE) - (padding * 2)
// No minimum enforced here - minimums are content-based
export const snapSizeToGrid = (size) => {
  // Add padding to both sides to get the total space needed
  const sizeWithPadding = size + (WIDGET_PADDING * 2)
  // Snap to grid units (no minimum constraint)
  const gridUnits = Math.max(1, Math.round(sizeWithPadding / GRID_SIZE))
  // Return size minus padding on both sides
  return (gridUnits * GRID_SIZE) - (WIDGET_PADDING * 2)
}

// Constrain widget position to viewport boundaries
export const constrainToViewport = (x, y, width, height) => {
  const minX = GRID_OFFSET_X + WIDGET_PADDING
  const minY = GRID_OFFSET_Y + WIDGET_PADDING
  const maxX = window.innerWidth - width - WIDGET_PADDING
  const maxY = window.innerHeight - height - WIDGET_PADDING
  
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y))
  }
}

// Constrain widget size to fit within viewport
export const constrainSizeToViewport = (x, y, width, height, minWidth = 0, minHeight = 0) => {
  const maxWidth = window.innerWidth - x - (WIDGET_PADDING * 2)
  const maxHeight = window.innerHeight - y - (WIDGET_PADDING * 2)
  
  return {
    width: Math.max(minWidth, Math.min(maxWidth, width)),
    height: Math.max(minHeight, Math.min(maxHeight, height))
  }
}

// Snap to grid while ensuring the result stays within viewport boundaries
// This prevents widgets from getting stuck at edges
export const snapToGridConstrained = (x, y, width, height, offsetX, offsetY) => {
  // Calculate viewport boundaries
  const minX = offsetX + WIDGET_PADDING
  const minY = offsetY + WIDGET_PADDING
  const maxX = window.innerWidth - width - WIDGET_PADDING
  const maxY = window.innerHeight - height - WIDGET_PADDING
  
  // First, constrain to viewport
  const constrained = constrainToViewport(x, y, width, height)
  
  // Snap to grid
  let snappedX = snapToGrid(constrained.x, offsetX)
  let snappedY = snapToGrid(constrained.y, offsetY)
  
  // Re-constrain after snapping (snapping might push us outside)
  const reConstrained = constrainToViewport(snappedX, snappedY, width, height)
  
  // If the re-constrained position is different from snapped, find nearest grid position within bounds
  if (reConstrained.x !== snappedX || reConstrained.y !== snappedY) {
    // Find the largest grid-aligned position that fits within maxX/maxY
    // This ensures we snap to a valid grid position that's still within viewport
    const adjustedX = reConstrained.x - offsetX - WIDGET_PADDING
    const gridUnitsX = Math.floor(adjustedX / GRID_SIZE)
    snappedX = Math.min(maxX, gridUnitsX * GRID_SIZE + offsetX + WIDGET_PADDING)
    snappedX = Math.max(minX, snappedX) // Ensure it's not less than minX
    
    const adjustedY = reConstrained.y - offsetY - WIDGET_PADDING
    const gridUnitsY = Math.floor(adjustedY / GRID_SIZE)
    snappedY = Math.min(maxY, gridUnitsY * GRID_SIZE + offsetY + WIDGET_PADDING)
    snappedY = Math.max(minY, snappedY) // Ensure it's not less than minY
  }
  
  return { x: snappedX, y: snappedY }
}

