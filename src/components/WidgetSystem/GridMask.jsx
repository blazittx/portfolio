import { useMemo } from 'react'
import { WIDGET_PADDING, GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../../constants/grid'
import { getRawUsableAreaBounds, getUsableGridWidth, getUsableGridHeight } from '../../utils/grid'
import { isMobile } from '../../utils/mobile'

/* eslint-disable react/prop-types */
export default function GridMask({ widgets, centerOffset = { x: 0, y: 0 }, isDragging = false, isResizing = false, dragStateRef, view = 'main' }) {
  const offsetX = centerOffset.x || 0
  const offsetY = centerOffset.y || 0
  const hasOffset = offsetX !== 0 || offsetY !== 0
  const mobile = isMobile()
  const rawBounds = getRawUsableAreaBounds(centerOffset, view)
  const overlayPosition = mobile ? 'absolute' : 'fixed'
  const overlayHeight = mobile ? `${rawBounds.maxY}px` : '100%'
  
  // Get the dragging widget ID if any
  const draggingWidgetId = dragStateRef?.current?.activeId || null
  
  // Calculate available area outline when dragging
  const availableAreaOutline = useMemo(() => {
    if (!isDragging) return null
    
    // Use raw bounds as the single source of truth for the usable area
    const gridWidth = getUsableGridWidth(view)
    const gridHeight = getUsableGridHeight(view)
    const occupiedCells = new Set()
    const availableCells = new Set()
    
    // Mark cells occupied by widgets (excluding the dragging widget)
    widgets.forEach(widget => {
      if (widget.id === draggingWidgetId) return
      
      // Widget positions are stored relative to the grid origin (GRID_OFFSET_X, GRID_OFFSET_Y)
      // The WidgetContainer applies a CSS transform based on centerOffset to move the grid visually
      // So widget.x is relative to the base grid origin, not including centerOffset
      // To get the grid cell start, subtract WIDGET_PADDING
      const widgetLeft = widget.x - WIDGET_PADDING
      const widgetTop = widget.y - WIDGET_PADDING
      const widgetRight = widget.x + widget.width + WIDGET_PADDING
      const widgetBottom = widget.y + widget.height + WIDGET_PADDING
      
      // Calculate grid cell indices relative to the base grid origin (GRID_OFFSET_X, GRID_OFFSET_Y)
      // This is correct because widget positions are stored relative to the base grid origin
      const baseGridX = GRID_OFFSET_X
      const baseGridY = GRID_OFFSET_Y
      const startCol = Math.floor((widgetLeft - baseGridX) / GRID_SIZE)
      const endCol = Math.ceil((widgetRight - baseGridX) / GRID_SIZE)
      const startRow = Math.floor((widgetTop - baseGridY) / GRID_SIZE)
      const endRow = Math.ceil((widgetBottom - baseGridY) / GRID_SIZE)
      
      // Mark all cells in this range as occupied (only if within valid grid bounds)
      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          // Only mark cells that are within the grid bounds
          if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
            occupiedCells.add(`${row},${col}`)
          }
        }
      }
    })
    
    // Find all available cells within the raw bounds
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const cellKey = `${row},${col}`
        if (!occupiedCells.has(cellKey)) {
          // Calculate pixel position for this cell using raw bounds (no double offset)
          const cellX = rawBounds.minX + col * GRID_SIZE
          const cellY = rawBounds.minY + row * GRID_SIZE
          
          // Verify cell is within raw bounds (should always be true, but double-check)
          if (cellX >= rawBounds.minX && 
              cellY >= rawBounds.minY &&
              cellX + GRID_SIZE <= rawBounds.maxX &&
              cellY + GRID_SIZE <= rawBounds.maxY) {
            availableCells.add(cellKey)
          }
        }
      }
    }
    
    if (availableCells.size === 0) return null
    
    // Helper to check if a cell is available
    const isAvailable = (row, col) => {
      if (row < 0 || row >= gridHeight || col < 0 || col >= gridWidth) {
        return false
      }
      return availableCells.has(`${row},${col}`)
    }
    
    // Build SVG path for the outline
    // We'll draw borders on edges where available cells meet occupied cells or boundaries
    // Use raw bounds directly (no transform needed - cells are positioned absolutely)
    const pathSegments = []
    const cellData = []
    
    // For each available cell, check its edges and store cell data
    availableCells.forEach(cellKey => {
      const [row, col] = cellKey.split(',').map(Number)
      // Position cells directly using raw bounds (matching debug visualization)
      const cellX = rawBounds.minX + col * GRID_SIZE
      const cellY = rawBounds.minY + row * GRID_SIZE
      
      // Store cell data for filling
      cellData.push({ x: cellX, y: cellY })
      
      // Check each edge: top, right, bottom, left
      // Top edge
      if (!isAvailable(row - 1, col)) {
        pathSegments.push(`M ${cellX} ${cellY} L ${cellX + GRID_SIZE} ${cellY}`)
      }
      // Right edge
      if (!isAvailable(row, col + 1)) {
        pathSegments.push(`M ${cellX + GRID_SIZE} ${cellY} L ${cellX + GRID_SIZE} ${cellY + GRID_SIZE}`)
      }
      // Bottom edge
      if (!isAvailable(row + 1, col)) {
        pathSegments.push(`M ${cellX + GRID_SIZE} ${cellY + GRID_SIZE} L ${cellX} ${cellY + GRID_SIZE}`)
      }
      // Left edge
      if (!isAvailable(row, col - 1)) {
        pathSegments.push(`M ${cellX} ${cellY + GRID_SIZE} L ${cellX} ${cellY}`)
      }
    })
    
    return {
      path: pathSegments.length > 0 ? pathSegments.join(' ') : null,
      cells: cellData
    }
  }, [isDragging, widgets, draggingWidgetId, rawBounds, view])
  
  return (
    <>
      {/* Original widget masks (for non-dragging state) */}
      <div
        style={{
          position: overlayPosition,
          top: 0,
          left: 0,
          width: '100%',
          height: overlayHeight,
          pointerEvents: 'none',
          transform: hasOffset ? `translate(${offsetX}px, ${offsetY}px)` : 'none',
          transition: (isDragging || isResizing) ? 'none' : 'transform 0.3s ease-out',
          opacity: isDragging ? 0 : 1
        }}
      >
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
                position: 'absolute',
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
      </div>
      
      {/* Glowing outline for available area when dragging */}
      {isDragging && availableAreaOutline && availableAreaOutline.path && (
        <div
          style={{
            position: overlayPosition,
            top: 0,
            left: 0,
            width: '100%',
            height: overlayHeight,
            pointerEvents: 'none',
            // No transform needed - cells are positioned using raw bounds directly
            zIndex: 1
          }}
        >
          {/* Fill cells with inner glow */}
          {availableAreaOutline.cells.map((cell, index) => (
            <div
              key={`available-cell-fill-${index}`}
              style={{
                position: 'absolute',
                left: `${cell.x}px`,
                top: `${cell.y}px`,
                width: `${GRID_SIZE}px`,
                height: `${GRID_SIZE}px`,
                background: 'rgba(255, 255, 255, 0.02)',
                pointerEvents: 'none',
                borderRadius: '1px'
              }}
            />
          ))}
          
          {/* Outline with glow */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            <defs>
              <filter id="glow-filter">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path
              d={availableAreaOutline.path}
              fill="none"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              style={{
                filter: 'url(#glow-filter)',
                opacity: 0.75,
                transition: 'opacity 0.2s ease-out'
              }}
            />
          </svg>
        </div>
      )}
    </>
  )
}
