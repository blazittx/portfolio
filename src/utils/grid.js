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
  
  // Enforce usable area bounds using raw bounds (for drag/resize operations)
  // Widgets must stay within the raw 34x19 area, accounting for padding
  const rawBounds = getRawUsableAreaBounds(centerOffset)
  const minX = rawBounds.minX + WIDGET_PADDING
  const minY = rawBounds.minY + WIDGET_PADDING
  const maxX = rawBounds.maxX - WIDGET_PADDING - width
  const maxY = rawBounds.maxY - WIDGET_PADDING - height
  
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y))
  }
}

// Constrain widget size to fit within usable grid area
// centerOffset is optional - if not provided, uses { x: 0, y: 0 }
export const constrainSizeToViewport = (x, y, width, height, minWidth = 0, minHeight = 0, centerOffset = { x: 0, y: 0 }) => {
  const rawBounds = getRawUsableAreaBounds(centerOffset)
  // Widget must fit within raw bounds, accounting for padding on all sides
  const maxWidth = rawBounds.maxX - WIDGET_PADDING - x
  const maxHeight = rawBounds.maxY - WIDGET_PADDING - y
  
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
  
  // Get raw usable area bounds for max calculations
  const rawBounds = getRawUsableAreaBounds(centerOffset)
  const maxX = rawBounds.maxX - WIDGET_PADDING - width
  const maxY = rawBounds.maxY - WIDGET_PADDING - height
  
  // If the re-constrained position is different from snapped, find nearest grid position within bounds
  if (reConstrained.x !== snappedX || reConstrained.y !== snappedY) {
    // Find the largest grid-aligned position that fits within bounds
    // This ensures we snap to a valid grid position that's still within usable area
    const adjustedX = reConstrained.x - offsetX - WIDGET_PADDING
    const gridUnitsX = Math.floor(adjustedX / GRID_SIZE)
    snappedX = Math.min(maxX, gridUnitsX * GRID_SIZE + offsetX + WIDGET_PADDING)
    snappedX = Math.max(rawBounds.minX + WIDGET_PADDING, snappedX) // Ensure it's not less than minX
    
    const adjustedY = reConstrained.y - offsetY - WIDGET_PADDING
    const gridUnitsY = Math.floor(adjustedY / GRID_SIZE)
    snappedY = Math.min(maxY, gridUnitsY * GRID_SIZE + offsetY + WIDGET_PADDING)
    snappedY = Math.max(rawBounds.minY + WIDGET_PADDING, snappedY) // Ensure it's not less than minY
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

// Get the raw bounds of the usable grid area (34x19) - SINGLE SOURCE OF TRUTH
// This is the actual grid area without any padding adjustments
export const getRawUsableAreaBounds = (centerOffset = { x: 0, y: 0 }) => {
  const offsetX = centerOffset.x || 0
  const offsetY = centerOffset.y || 0
  
  // Calculate the raw usable area position (grid offset + center offset)
  const areaStartX = GRID_OFFSET_X + offsetX
  const areaStartY = GRID_OFFSET_Y + offsetY
  const areaWidth = USABLE_GRID_WIDTH * GRID_SIZE
  const areaHeight = USABLE_GRID_HEIGHT * GRID_SIZE
  
  return {
    minX: areaStartX,
    minY: areaStartY,
    maxX: areaStartX + areaWidth,
    maxY: areaStartY + areaHeight
  }
}

// Get the bounds of the usable grid area for widget placement (accounting for padding)
// Widgets are positioned with padding, so this returns the area where widgets can be placed
export const getUsableAreaBounds = (centerOffset = { x: 0, y: 0 }) => {
  const rawBounds = getRawUsableAreaBounds(centerOffset)
  
  // Widgets are positioned with padding, so the placement area is inside the raw bounds
  return {
    minX: rawBounds.minX + WIDGET_PADDING,
    minY: rawBounds.minY + WIDGET_PADDING,
    maxX: rawBounds.maxX - WIDGET_PADDING,
    maxY: rawBounds.maxY - WIDGET_PADDING
  }
}

// Check if a widget is within the usable area bounds
// Widgets must be fully contained within the raw 34x19 area
export const isWithinUsableArea = (x, y, width, height, centerOffset = { x: 0, y: 0 }) => {
  const rawBounds = getRawUsableAreaBounds(centerOffset)
  const widgetRight = x + width
  const widgetBottom = y + height
  
  // Widget must be fully within the raw bounds (accounting for padding on all sides)
  // Widget position includes padding, so we need to check if the widget + its padding fits
  return (
    x >= rawBounds.minX + WIDGET_PADDING &&
    y >= rawBounds.minY + WIDGET_PADDING &&
    widgetRight <= rawBounds.maxX - WIDGET_PADDING &&
    widgetBottom <= rawBounds.maxY - WIDGET_PADDING
  )
}

