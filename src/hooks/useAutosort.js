import { useCallback } from 'react'
import { snapToGrid, getRawUsableAreaBounds } from '../utils/grid'
import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, WIDGET_PADDING } from '../constants/grid'

export const useAutosort = (widgets, setWidgets, centerOffset = { x: 0, y: 0 }) => {
  // Autosort widgets in a puzzle-like layout (no gaps, tight packing)
  const autosortWidgets = useCallback(() => {
    // Use raw bounds as the single source of truth for the 34x19 area
    const rawBounds = getRawUsableAreaBounds(centerOffset)
    // Start position is at the top-left of the usable area with padding
    const startX = rawBounds.minX + WIDGET_PADDING
    const startY = rawBounds.minY + WIDGET_PADDING
    
    // Separate locked/pinned and unlocked/unpinned widgets
    // Locked and pinned widgets should not be moved by autosort
    const fixedWidgets = widgets.filter(w => w.locked || w.pinned)
    const movableWidgets = widgets.filter(w => !w.locked && !w.pinned)
    
    // Sort movable widgets by area (largest first) for better packing
    const sortedMovable = [...movableWidgets].sort((a, b) => {
      const areaA = a.width * a.height
      const areaB = b.width * b.height
      return areaB - areaA
    })
    
    // Track occupied areas (from fixed widgets - locked or pinned)
    const occupiedRects = fixedWidgets.map(w => ({
      x: w.x,
      y: w.y,
      width: w.width,
      height: w.height,
      right: w.x + w.width,
      bottom: w.y + w.height
    }))
    
    // Helper to check if a position is available
    const isPositionAvailable = (x, y, width, height) => {
      // Check raw bounds (34x19 area) - widgets must fit within the raw area with padding
      if (x < startX || y < startY) return false
      if (x + width > rawBounds.maxX - WIDGET_PADDING) return false
      if (y + height > rawBounds.maxY - WIDGET_PADDING) return false
      
      // Check collision with occupied areas
      const testRect = { x, y, width, height, right: x + width, bottom: y + height }
      for (const occupied of occupiedRects) {
        if (!(
          testRect.right <= occupied.x ||
          occupied.right <= testRect.x ||
          testRect.bottom <= occupied.y ||
          occupied.bottom <= testRect.y
        )) {
          return false
        }
      }
      return true
    }
    
    // Find best position for a widget (bottom-left fill algorithm)
    const findBestPosition = (width, height) => {
      // Collect all candidate positions from occupied rects (right edges and bottom edges)
      const candidateX = new Set([startX])
      const candidateY = new Set([startY])
      
      occupiedRects.forEach(rect => {
        candidateX.add(rect.right) // Try right after each widget
        candidateX.add(rect.x) // Try at each widget's left edge
        candidateY.add(rect.bottom) // Try below each widget
        candidateY.add(rect.y) // Try at each widget's top edge
      })
      
      // Convert to sorted arrays
      const sortedX = Array.from(candidateX).sort((a, b) => a - b)
      const sortedY = Array.from(candidateY).sort((a, b) => a - b)
      
      // Try each combination, prioritizing top-left positions
      for (const y of sortedY) {
        for (const x of sortedX) {
          const snappedX = snapToGrid(x, GRID_OFFSET_X)
          const snappedY = snapToGrid(y, GRID_OFFSET_Y)
          
          if (isPositionAvailable(snappedX, snappedY, width, height)) {
            return { x: snappedX, y: snappedY }
          }
        }
      }
      
      // Fallback: grid-based scan within raw bounds
      for (let y = startY; y <= rawBounds.maxY - WIDGET_PADDING - height; y += GRID_SIZE) {
        for (let x = startX; x <= rawBounds.maxX - WIDGET_PADDING - width; x += GRID_SIZE) {
          const snappedX = snapToGrid(x, GRID_OFFSET_X)
          const snappedY = snapToGrid(y, GRID_OFFSET_Y)
          
          if (isPositionAvailable(snappedX, snappedY, width, height)) {
            return { x: snappedX, y: snappedY }
          }
        }
      }
      
      // Last resort: return start position
      return { x: startX, y: startY }
    }
    
    setWidgets(() => {
      const newWidgets = [...fixedWidgets]
      
      // Place each movable widget in the best available position
      sortedMovable.forEach(widget => {
        const position = findBestPosition(widget.width, widget.height)
        
        // Add to occupied areas
        occupiedRects.push({
          x: position.x,
          y: position.y,
          width: widget.width,
          height: widget.height,
          right: position.x + widget.width,
          bottom: position.y + widget.height
        })
        
        newWidgets.push({
          ...widget,
          x: position.x,
          y: position.y
        })
      })
      
      return newWidgets
    })
  }, [widgets, setWidgets, centerOffset])

  return autosortWidgets
}

