import { useCallback } from 'react'
import { snapToGrid } from '../utils/grid'
import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../constants/grid'

export const useAutosort = (widgets, setWidgets) => {
  // Autosort widgets in a puzzle-like layout (no gaps, tight packing)
  const autosortWidgets = useCallback(() => {
    const padding = 20
    const startX = snapToGrid(padding, GRID_OFFSET_X)
    const startY = snapToGrid(padding, GRID_OFFSET_Y)
    
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
      // Check viewport bounds
      if (x < startX || y < startY) return false
      if (x + width > window.innerWidth - padding) return false
      if (y + height > window.innerHeight - padding) return false
      
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
      
      // Fallback: grid-based scan
      for (let y = startY; y <= window.innerHeight - padding - height; y += GRID_SIZE) {
        for (let x = startX; x <= window.innerWidth - padding - width; x += GRID_SIZE) {
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
  }, [widgets, setWidgets])

  return autosortWidgets
}

