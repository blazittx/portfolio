import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, WIDGET_PADDING, USABLE_GRID_WIDTH, USABLE_GRID_HEIGHT } from '../constants/grid'

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

// Constrain widget position to usable grid area boundaries
// centerOffset is optional - if not provided, uses { x: 0, y: 0 }
// enforceBounds: if false, only ensures widget doesn't go completely outside viewport (for loading saved layouts)
export const constrainToViewport = (x, y, width, height, centerOffset = { x: 0, y: 0 }, enforceBounds = true) => {
  if (!enforceBounds) {
    // Just ensure widget is visible on screen (for loading saved layouts)
    const minX = 0
    const minY = 0
    const maxX = window.innerWidth - width
    const maxY = window.innerHeight - height
    
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    }
  }
  
  // Enforce usable area bounds (for drag/resize operations)
  const bounds = getUsableAreaBounds(centerOffset)
  const maxX = bounds.maxX - width
  const maxY = bounds.maxY - height
  
  return {
    x: Math.max(bounds.minX, Math.min(maxX, x)),
    y: Math.max(bounds.minY, Math.min(maxY, y))
  }
}

// Constrain widget size to fit within usable grid area
// centerOffset is optional - if not provided, uses { x: 0, y: 0 }
export const constrainSizeToViewport = (x, y, width, height, minWidth = 0, minHeight = 0, centerOffset = { x: 0, y: 0 }) => {
  const bounds = getUsableAreaBounds(centerOffset)
  const maxWidth = bounds.maxX - x
  const maxHeight = bounds.maxY - y
  
  return {
    width: Math.max(minWidth, Math.min(maxWidth, width)),
    height: Math.max(minHeight, Math.min(maxHeight, height))
  }
}

// Snap to grid while ensuring the result stays within usable area boundaries
// This prevents widgets from getting stuck at edges
export const snapToGridConstrained = (x, y, width, height, offsetX, offsetY, centerOffset = { x: 0, y: 0 }) => {
  // First, constrain to usable area
  const constrained = constrainToViewport(x, y, width, height, centerOffset)
  
  // Snap to grid
  let snappedX = snapToGrid(constrained.x, offsetX)
  let snappedY = snapToGrid(constrained.y, offsetY)
  
  // Re-constrain after snapping (snapping might push us outside)
  const reConstrained = constrainToViewport(snappedX, snappedY, width, height, centerOffset)
  
  // Get usable area bounds for max calculations
  const bounds = getUsableAreaBounds(centerOffset)
  const maxX = bounds.maxX - width
  const maxY = bounds.maxY - height
  
  // If the re-constrained position is different from snapped, find nearest grid position within bounds
  if (reConstrained.x !== snappedX || reConstrained.y !== snappedY) {
    // Find the largest grid-aligned position that fits within bounds
    // This ensures we snap to a valid grid position that's still within usable area
    const adjustedX = reConstrained.x - offsetX - WIDGET_PADDING
    const gridUnitsX = Math.floor(adjustedX / GRID_SIZE)
    snappedX = Math.min(maxX, gridUnitsX * GRID_SIZE + offsetX + WIDGET_PADDING)
    snappedX = Math.max(bounds.minX, snappedX) // Ensure it's not less than minX
    
    const adjustedY = reConstrained.y - offsetY - WIDGET_PADDING
    const gridUnitsY = Math.floor(adjustedY / GRID_SIZE)
    snappedY = Math.min(maxY, gridUnitsY * GRID_SIZE + offsetY + WIDGET_PADDING)
    snappedY = Math.max(bounds.minY, snappedY) // Ensure it's not less than minY
  }
  
  return { x: snappedX, y: snappedY }
}

// Calculate the horizontal and vertical offsets needed to center the usable grid area
// Returns an object with x and y offsets in pixels
export const calculateCenterOffset = () => {
  // Calculate the size of the usable grid area in pixels
  const usableAreaWidth = USABLE_GRID_WIDTH * GRID_SIZE
  const usableAreaHeight = USABLE_GRID_HEIGHT * GRID_SIZE
  
  // Calculate the center of the usable grid area (starting from grid offset)
  const usableAreaCenterX = GRID_OFFSET_X + (usableAreaWidth / 2)
  const usableAreaCenterY = GRID_OFFSET_Y + (usableAreaHeight / 2)
  
  // Calculate the center of the viewport
  const viewportCenterX = window.innerWidth / 2
  const viewportCenterY = window.innerHeight / 2
  
  // Calculate the offsets needed to center the usable area
  const offsetX = viewportCenterX - usableAreaCenterX
  const offsetY = viewportCenterY - usableAreaCenterY
  
  // Snap the offsets to grid for better alignment
  const gridUnitsX = Math.round(offsetX / GRID_SIZE)
  const gridUnitsY = Math.round(offsetY / GRID_SIZE)
  const snappedOffsetX = gridUnitsX * GRID_SIZE
  const snappedOffsetY = gridUnitsY * GRID_SIZE
  
  return { x: snappedOffsetX, y: snappedOffsetY }
}

// Get the bounds of the usable grid area (accounting for center offset)
export const getUsableAreaBounds = (centerOffset = { x: 0, y: 0 }) => {
  const offsetX = centerOffset.x || 0
  const offsetY = centerOffset.y || 0
  
  // Calculate the usable area position (grid offset + center offset)
  const areaStartX = GRID_OFFSET_X + offsetX + WIDGET_PADDING
  const areaStartY = GRID_OFFSET_Y + offsetY + WIDGET_PADDING
  const areaWidth = USABLE_GRID_WIDTH * GRID_SIZE - (WIDGET_PADDING * 2)
  const areaHeight = USABLE_GRID_HEIGHT * GRID_SIZE - (WIDGET_PADDING * 2)
  
  return {
    minX: areaStartX,
    minY: areaStartY,
    maxX: areaStartX + areaWidth,
    maxY: areaStartY + areaHeight
  }
}

// Check if a widget is within the usable area bounds
export const isWithinUsableArea = (x, y, width, height, centerOffset = { x: 0, y: 0 }) => {
  const bounds = getUsableAreaBounds(centerOffset)
  const widgetRight = x + width
  const widgetBottom = y + height
  
  return (
    x >= bounds.minX &&
    y >= bounds.minY &&
    widgetRight <= bounds.maxX &&
    widgetBottom <= bounds.maxY
  )
}

