// Screen filling utilities for responsive widget layout
import { GRID_OFFSET_X, GRID_OFFSET_Y, WIDGET_PADDING, getWidgetMinSize } from '../constants/grid'
import { snapSizeToGrid, constrainSizeToViewport } from './grid'

// Preferred percentage sizes for each widget type
// These represent the ideal percentage of screen width/height each widget should occupy
export const WIDGET_PREFERRED_PERCENTAGES = {
  profile: { width: 0.10, height: 0.05 }, // 25% width, 20% height
  about: { width: 0.20, height: 0.20 },   // 20% width, 15% height
  skills: { width: 0.20, height: 0.15 },   // 20% width, 15% height
  contact: { width: 0.40, height: 0.15 }, // 40% width, 15% height
  games: { width: 0.25, height: 0.80 },   // 25% width, 20% height
  visitors: { width: 0.20, height: 0.15 }, // 20% width, 15% height
  motd: { width: 0.20, height: 0.15 },    // 20% width, 15% height
  quote: { width: 0.20, height: 0.20 },   // 20% width, 20% height
  time: { width: 0.20, height: 0.15 },     // 20% width, 15% height
  github: { width: 0.30, height: 0.25 },  // 30% width, 25% height
  apikey: { width: 0.25, height: 0.15 }, // 25% width, 15% height
}

/**
 * Calculate the available screen space for widgets
 * Accounts for grid offsets and padding
 */
export const getAvailableScreenSpace = () => {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Available space is viewport minus grid offsets and padding
  const availableWidth = viewportWidth - (GRID_OFFSET_X * 2) - (WIDGET_PADDING * 2)
  const availableHeight = viewportHeight - (GRID_OFFSET_Y * 2) - (WIDGET_PADDING * 2)
  
  return { width: availableWidth, height: availableHeight }
}

/**
 * Calculate preferred size for a widget based on screen size and preferences
 */
export const getPreferredWidgetSize = (widgetType, availableWidth, availableHeight) => {
  const preferences = WIDGET_PREFERRED_PERCENTAGES[widgetType] || { width: 0.20, height: 0.15 }
  const minSize = getWidgetMinSize(widgetType)
  
  // Calculate preferred size based on percentages
  let preferredWidth = availableWidth * preferences.width
  let preferredHeight = availableHeight * preferences.height
  
  // Ensure we don't go below minimum size
  preferredWidth = Math.max(preferredWidth, minSize.width)
  preferredHeight = Math.max(preferredHeight, minSize.height)
  
  // Snap to grid
  const snappedWidth = snapSizeToGrid(preferredWidth)
  const snappedHeight = snapSizeToGrid(preferredHeight)
  
  return { width: snappedWidth, height: snappedHeight }
}

/**
 * Calculate optimal widget sizes to fill the screen
 * This function tries to maintain preferred percentages while filling available space
 */
export const calculateOptimalWidgetSizes = (widgets) => {
  const availableSpace = getAvailableScreenSpace()
  const updatedWidgets = []
  
  // Calculate preferred sizes for all widgets
  const preferredSizes = widgets.map(widget => ({
    widget,
    preferred: getPreferredWidgetSize(widget.type || widget.id, availableSpace.width, availableSpace.height),
    minSize: getWidgetMinSize(widget.type || widget.id)
  }))
  
  // Calculate total preferred area
  let totalPreferredArea = 0
  preferredSizes.forEach(({ preferred }) => {
    totalPreferredArea += preferred.width * preferred.height
  })
  
  // Calculate available area
  const availableArea = availableSpace.width * availableSpace.height
  
  // If widgets don't fill the screen, scale them up proportionally
  // But respect minimum sizes and don't exceed viewport
  if (totalPreferredArea < availableArea * 0.8) { // Only scale if we're using less than 80% of space
    const scaleFactor = Math.min(1.5, Math.sqrt(availableArea / totalPreferredArea)) // Cap at 1.5x
    
    preferredSizes.forEach(({ widget, preferred, minSize }) => {
      let newWidth = preferred.width * scaleFactor
      let newHeight = preferred.height * scaleFactor
      
      // Ensure minimums
      newWidth = Math.max(newWidth, minSize.width)
      newHeight = Math.max(newHeight, minSize.height)
      
      // Constrain to viewport
      const constrained = constrainSizeToViewport(
        widget.x || 0,
        widget.y || 0,
        newWidth,
        newHeight,
        minSize.width,
        minSize.height
      )
      
      // Snap to grid
      const snappedWidth = snapSizeToGrid(constrained.width)
      const snappedHeight = snapSizeToGrid(constrained.height)
      
      updatedWidgets.push({
        ...widget,
        width: snappedWidth,
        height: snappedHeight
      })
    })
  } else {
    // Use preferred sizes as-is
    preferredSizes.forEach(({ widget, preferred }) => {
      updatedWidgets.push({
        ...widget,
        width: preferred.width,
        height: preferred.height
      })
    })
  }
  
  return updatedWidgets
}

/**
 * Adjust widget sizes to better fill the screen while maintaining layout
 * This function ONLY scales widget sizes - it does NOT change positions or layout
 * @param {Array} widgets - The widgets to adjust
 * @param {Array} fixedWidgets - Fixed widgets (locked/pinned) - not used but kept for API compatibility
 */
// eslint-disable-next-line no-unused-vars
export const fillScreenWithWidgets = (widgets, fixedWidgets = []) => {
  const availableSpace = getAvailableScreenSpace()
  
  // If no widgets, return empty array
  if (!widgets || widgets.length === 0) return widgets
  
  // Calculate preferred sizes for all widgets based on percentages
  const widgetsWithPreferredSizes = widgets.map(widget => {
    const preferences = WIDGET_PREFERRED_PERCENTAGES[widget.type || widget.id] || { width: 0.20, height: 0.15 }
    const minSize = getWidgetMinSize(widget.type || widget.id)
    
    // Calculate preferred size based on percentages
    let preferredWidth = availableSpace.width * preferences.width
    let preferredHeight = availableSpace.height * preferences.height
    
    // Ensure minimums
    preferredWidth = Math.max(preferredWidth, minSize.width)
    preferredHeight = Math.max(preferredHeight, minSize.height)
    
    // Snap to grid
    const snappedWidth = snapSizeToGrid(preferredWidth)
    const snappedHeight = snapSizeToGrid(preferredHeight)
    
    return {
      ...widget,
      preferredWidth: snappedWidth,
      preferredHeight: snappedHeight,
      minSize
    }
  })
  
  // Calculate total preferred area
  let totalPreferredArea = 0
  widgetsWithPreferredSizes.forEach(w => {
    totalPreferredArea += w.preferredWidth * w.preferredHeight
  })
  
  const availableArea = availableSpace.width * availableSpace.height
  const fillRatio = totalPreferredArea / availableArea
  
  // If we're using less than 70% of available space, scale up widgets proportionally
  const scaleFactor = fillRatio < 0.7 
    ? Math.min(1.8, Math.sqrt(0.7 / fillRatio)) 
    : 1.0
  
  // Scale all widgets while keeping their positions unchanged
  return widgetsWithPreferredSizes.map((widget) => {
    // Calculate target size (preferred size * scale factor)
    let targetWidth = widget.preferredWidth * scaleFactor
    let targetHeight = widget.preferredHeight * scaleFactor
    
    // Ensure minimums
    targetWidth = Math.max(targetWidth, widget.minSize.width)
    targetHeight = Math.max(targetHeight, widget.minSize.height)
    
    // Constrain to viewport (but keep original position)
    const constrainedSize = constrainSizeToViewport(
      widget.x || 0,
      widget.y || 0,
      targetWidth,
      targetHeight,
      widget.minSize.width,
      widget.minSize.height
    )
    
    // Snap to grid
    const finalWidth = snapSizeToGrid(constrainedSize.width)
    const finalHeight = snapSizeToGrid(constrainedSize.height)
    
    // Return widget with updated size but SAME position
    return {
      id: widget.id,
      type: widget.type,
      x: widget.x, // Keep original position
      y: widget.y, // Keep original position
      width: finalWidth,
      height: finalHeight,
      component: widget.component,
      locked: widget.locked,
      pinned: widget.pinned
    }
  })
}

