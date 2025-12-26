import { useMemo } from 'react'
import { WIDGET_PADDING, GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, USABLE_GRID_WIDTH, USABLE_GRID_HEIGHT } from '../../constants/grid'
import { getUsableAreaBounds } from '../../utils/grid'

/* eslint-disable react/prop-types */
export default function GridMask({ widgets, centerOffset = { x: 0, y: 0 }, isDragging = false, isResizing = false, dragStateRef }) {
  const offsetX = centerOffset.x || 0
  const offsetY = centerOffset.y || 0
  const hasOffset = offsetX !== 0 || offsetY !== 0
  
  // Get the dragging widget ID if any
  const draggingWidgetId = dragStateRef?.current?.activeId || null
  
  // Calculate available area outline when dragging
  const availableAreaOutline = useMemo(() => {
    if (!isDragging) return null
    
    const bounds = getUsableAreaBounds(centerOffset)
    const occupiedCells = new Set()
    const availableCells = new Set()
    
    // Mark cells occupied by widgets (excluding the dragging widget)
    widgets.forEach(widget => {
      if (widget.id === draggingWidgetId) return
      
      // Widget position (widget.x, widget.y) is already at: grid_cell_start + offset + WIDGET_PADDING
      // To get the grid cell start, we subtract WIDGET_PADDING and offset
      const widgetLeft = widget.x - WIDGET_PADDING
      const widgetTop = widget.y - WIDGET_PADDING
      const widgetRight = widget.x + widget.width + WIDGET_PADDING
      const widgetBottom = widget.y + widget.height + WIDGET_PADDING
      
      // Calculate grid cell indices
      // Grid cells start at GRID_OFFSET_X + offsetX, so we need to subtract that
      const baseX = GRID_OFFSET_X + offsetX
      const baseY = GRID_OFFSET_Y + offsetY
      
      const startCol = Math.floor((widgetLeft - baseX) / GRID_SIZE)
      const endCol = Math.ceil((widgetRight - baseX) / GRID_SIZE)
      const startRow = Math.floor((widgetTop - baseY) / GRID_SIZE)
      const endRow = Math.ceil((widgetBottom - baseY) / GRID_SIZE)
      
      // Mark all cells in this range as occupied
      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          if (row >= 0 && row < USABLE_GRID_HEIGHT && col >= 0 && col < USABLE_GRID_WIDTH) {
            occupiedCells.add(`${row},${col}`)
          }
        }
      }
    })
    
    // Find all available cells
    for (let row = 0; row < USABLE_GRID_HEIGHT; row++) {
      for (let col = 0; col < USABLE_GRID_WIDTH; col++) {
        const cellKey = `${row},${col}`
        if (!occupiedCells.has(cellKey)) {
          // Calculate pixel position for this cell
          const cellX = GRID_OFFSET_X + offsetX + col * GRID_SIZE
          const cellY = GRID_OFFSET_Y + offsetY + row * GRID_SIZE
          
          // Only include cells that are within usable bounds
          if (cellX >= bounds.minX - WIDGET_PADDING && 
              cellY >= bounds.minY - WIDGET_PADDING &&
              cellX + GRID_SIZE <= bounds.maxX + WIDGET_PADDING &&
              cellY + GRID_SIZE <= bounds.maxY + WIDGET_PADDING) {
            availableCells.add(cellKey)
          }
        }
      }
    }
    
    if (availableCells.size === 0) return null
    
    // Helper to check if a cell is available
    const isAvailable = (row, col) => {
      if (row < 0 || row >= USABLE_GRID_HEIGHT || col < 0 || col >= USABLE_GRID_WIDTH) {
        return false
      }
      return availableCells.has(`${row},${col}`)
    }
    
    // Build SVG path for the outline
    // We'll draw borders on edges where available cells meet occupied cells or boundaries
    const baseX = GRID_OFFSET_X + offsetX
    const baseY = GRID_OFFSET_Y + offsetY
    const pathSegments = []
    const cellData = []
    
    // For each available cell, check its edges and store cell data
    availableCells.forEach(cellKey => {
      const [row, col] = cellKey.split(',').map(Number)
      const cellX = baseX + col * GRID_SIZE
      const cellY = baseY + row * GRID_SIZE
      
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
  }, [isDragging, widgets, draggingWidgetId, centerOffset, offsetX, offsetY])
  
  return (
    <>
      {/* Original widget masks (for non-dragging state) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
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
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            transform: hasOffset ? `translate(${offsetX}px, ${offsetY}px)` : 'none',
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

