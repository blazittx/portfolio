import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, WIDGET_PADDING, USABLE_GRID_WIDTH, USABLE_GRID_HEIGHT, USABLE_GRID_WIDTH_MOBILE, USABLE_GRID_HEIGHT_MOBILE, USABLE_GRID_WIDTH_CV, USABLE_GRID_HEIGHT_CV } from '../constants/grid'
import { isMobile } from './mobile'

// Get the appropriate grid dimensions based on screen size
export const getUsableGridWidth = (view = 'main') => {
  if (view === 'cv-detail') return USABLE_GRID_WIDTH_CV
  return isMobile() ? USABLE_GRID_WIDTH_MOBILE : USABLE_GRID_WIDTH
}

export const getUsableGridHeight = (view = 'main') => {
  if (view === 'cv-detail') return USABLE_GRID_HEIGHT_CV
  return isMobile() ? USABLE_GRID_HEIGHT_MOBILE : USABLE_GRID_HEIGHT
}

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

// Convert grid-based layout units to pixel positioning for rendering.
export const gridToPixels = ({ col, row, w, h }) => ({
  x: GRID_OFFSET_X + WIDGET_PADDING + col * GRID_SIZE,
  y: GRID_OFFSET_Y + WIDGET_PADDING + row * GRID_SIZE,
  width: (w * GRID_SIZE) - (WIDGET_PADDING * 2),
  height: (h * GRID_SIZE) - (WIDGET_PADDING * 2)
})

// Convert pixel positioning to grid-based layout units.
export const pixelsToGrid = ({ x, y, width, height }) => ({
  col: Math.round((x - GRID_OFFSET_X - WIDGET_PADDING) / GRID_SIZE),
  row: Math.round((y - GRID_OFFSET_Y - WIDGET_PADDING) / GRID_SIZE),
  w: Math.round((width + WIDGET_PADDING * 2) / GRID_SIZE),
  h: Math.round((height + WIDGET_PADDING * 2) / GRID_SIZE)
})

// Constrain widget position to usable grid area boundaries
// centerOffset is optional - kept for API compatibility but not used (widgets are relative to base grid)
// enforceBounds: if false, only ensures widget doesn't go completely outside viewport (for loading saved layouts)
// view: 'main', 'game-detail', or 'cv-detail' - determines which grid dimensions to use
// eslint-disable-next-line no-unused-vars
export const constrainToViewport = (x, y, width, height, centerOffset = { x: 0, y: 0 }, enforceBounds = true, view = 'main') => {
  if (!enforceBounds) {
    // Just ensure widget is visible on screen (for loading saved layouts)
    const minX = 0
    const minY = 0
    const maxX = window.innerWidth - width
    const maxY = window.innerHeight - height

    // On mobile, allow vertical overflow for scrolling layouts.
    // Only clamp Y to the top so widgets can live below the fold.
    const clampedX = Math.max(minX, Math.min(maxX, x))
    const clampedY = isMobile() ? Math.max(minY, y) : Math.max(minY, Math.min(maxY, y))

    return { x: clampedX, y: clampedY }
  }
  
  // Enforce usable area bounds (for drag/resize operations)
  // Widgets must stay within the usable area, accounting for padding
  // Widget positions are relative to base grid origin (GRID_OFFSET_X, GRID_OFFSET_Y)
  // So we calculate bounds relative to base grid origin (not including centerOffset)
  const gridWidth = getUsableGridWidth(view)
  const gridHeight = getUsableGridHeight(view)
  const minX = GRID_OFFSET_X + WIDGET_PADDING
  const minY = GRID_OFFSET_Y + WIDGET_PADDING
  const maxX = GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING - width
  const maxY = GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING - height
  
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y))
  }
}

// Constrain widget size to fit within usable grid area
// centerOffset is optional - kept for API compatibility but not used (widgets are relative to base grid)
// view: 'main', 'game-detail', or 'cv-detail' - determines which grid dimensions to use
// eslint-disable-next-line no-unused-vars
export const constrainSizeToViewport = (x, y, width, height, minWidth = 0, minHeight = 0, centerOffset = { x: 0, y: 0 }, view = 'main') => {
  // Widget positions are relative to base grid origin, so calculate bounds relative to base grid
  const gridWidth = getUsableGridWidth(view)
  const gridHeight = getUsableGridHeight(view)
  const maxWidth = GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING - x
  const maxHeight = GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING - y
  
  return {
    width: Math.max(minWidth, Math.min(maxWidth, width)),
    height: Math.max(minHeight, Math.min(maxHeight, height))
  }
}

// Snap to grid while ensuring the result stays within usable area boundaries
// This prevents widgets from getting stuck at edges
export const snapToGridConstrained = (x, y, width, height, offsetX, offsetY, centerOffset = { x: 0, y: 0 }, view = 'main') => {
  // First, constrain to usable area
  const constrained = constrainToViewport(x, y, width, height, centerOffset, true, view)
  
  // Snap to grid
  let snappedX = snapToGrid(constrained.x, offsetX)
  let snappedY = snapToGrid(constrained.y, offsetY)
  
  // Re-constrain after snapping (snapping might push us outside)
  const reConstrained = constrainToViewport(snappedX, snappedY, width, height, centerOffset, true, view)
  
  // Get usable area bounds relative to base grid origin for max calculations
  const gridWidth = getUsableGridWidth(view)
  const gridHeight = getUsableGridHeight(view)
  const maxX = GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING - width
  const maxY = GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING - height
  const minX = GRID_OFFSET_X + WIDGET_PADDING
  const minY = GRID_OFFSET_Y + WIDGET_PADDING
  
  // If the re-constrained position is different from snapped, find nearest grid position within bounds
  if (reConstrained.x !== snappedX || reConstrained.y !== snappedY) {
    // Find the largest grid-aligned position that fits within bounds
    // This ensures we snap to a valid grid position that's still within usable area
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

// Calculate the horizontal and vertical offsets needed to center the usable grid area
// Returns an object with x and y offsets in pixels
// On mobile: centers horizontally only, keeps grid at top (y = 0)
// On desktop: centers both horizontally and vertically
// view: 'main', 'game-detail', or 'cv-detail' - determines which grid dimensions to use
export const calculateCenterOffset = (view = 'main') => {
  const mobile = isMobile()
  
  // Calculate the size of the usable grid area in pixels
  const gridWidth = getUsableGridWidth(view)
  const gridHeight = getUsableGridHeight(view)
  const usableAreaWidth = gridWidth * GRID_SIZE
  const usableAreaHeight = gridHeight * GRID_SIZE
  
  // Calculate the center of the usable grid area (starting from grid offset)
  const usableAreaCenterX = GRID_OFFSET_X + (usableAreaWidth / 2)
  
  // Calculate the center of the viewport
  const viewportCenterX = window.innerWidth / 2
  
  // Calculate the horizontal offset needed to center the usable area
  const offsetX = viewportCenterX - usableAreaCenterX
  
  // Snap the horizontal offset to grid for better alignment
  const gridUnitsX = Math.round(offsetX / GRID_SIZE)
  const snappedOffsetX = gridUnitsX * GRID_SIZE
  
  // On mobile: keep grid at top (y = 0), on desktop: center vertically
  // For CV view, always center vertically
  let snappedOffsetY = 0
  if (!mobile || view === 'cv-detail') {
    const usableAreaCenterY = GRID_OFFSET_Y + (usableAreaHeight / 2)
    const viewportCenterY = window.innerHeight / 2
    const offsetY = viewportCenterY - usableAreaCenterY
    const gridUnitsY = Math.round(offsetY / GRID_SIZE)
    snappedOffsetY = gridUnitsY * GRID_SIZE
  }
  
  return { x: snappedOffsetX, y: snappedOffsetY }
}

// Get the raw bounds of the usable grid area - SINGLE SOURCE OF TRUTH
// This is the actual grid area without any padding adjustments
export const getRawUsableAreaBounds = (centerOffset = { x: 0, y: 0 }, view = 'main') => {
  const offsetX = centerOffset.x || 0
  const offsetY = centerOffset.y || 0
  
  // Calculate the raw usable area position (grid offset + center offset)
  const gridWidth = getUsableGridWidth(view)
  const gridHeight = getUsableGridHeight(view)
  const areaStartX = GRID_OFFSET_X + offsetX
  const areaStartY = GRID_OFFSET_Y + offsetY
  const areaWidth = gridWidth * GRID_SIZE
  const areaHeight = gridHeight * GRID_SIZE
  
  return {
    minX: areaStartX,
    minY: areaStartY,
    maxX: areaStartX + areaWidth,
    maxY: areaStartY + areaHeight
  }
}

// Get the bounds of the usable grid area for widget placement (accounting for padding)
// Widgets are positioned with padding, so this returns the area where widgets can be placed
export const getUsableAreaBounds = (centerOffset = { x: 0, y: 0 }, view = 'main') => {
  const rawBounds = getRawUsableAreaBounds(centerOffset, view)
  
  // Widgets are positioned with padding, so the placement area is inside the raw bounds
  return {
    minX: rawBounds.minX + WIDGET_PADDING,
    minY: rawBounds.minY + WIDGET_PADDING,
    maxX: rawBounds.maxX - WIDGET_PADDING,
    maxY: rawBounds.maxY - WIDGET_PADDING
  }
}

// Check if a widget is within the usable area bounds
// Widgets must be fully contained within the usable area
// Widget positions are relative to base grid origin, so compare to bounds relative to base grid
// centerOffset is kept for API compatibility but not used (widgets are relative to base grid)
// view: 'main', 'game-detail', or 'cv-detail' - determines which grid dimensions to use
// eslint-disable-next-line no-unused-vars
export const isWithinUsableArea = (x, y, width, height, centerOffset = { x: 0, y: 0 }, view = 'main') => {
  const widgetRight = x + width
  const widgetBottom = y + height
  
  // Widget must be fully within the usable area (accounting for padding on all sides)
  // Compare to bounds relative to base grid origin (where widgets are positioned)
  const gridWidth = getUsableGridWidth(view)
  const gridHeight = getUsableGridHeight(view)
  const minX = GRID_OFFSET_X + WIDGET_PADDING
  const minY = GRID_OFFSET_Y + WIDGET_PADDING
  const maxX = GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING
  const maxY = GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING
  
  return (
    x >= minX &&
    y >= minY &&
    widgetRight <= maxX &&
    widgetBottom <= maxY
  )
}
