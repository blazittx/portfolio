import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import ProfileWidget from './components/ProfileWidget'
import AboutWidget from './components/AboutWidget'
import ProjectsWidget from './components/ProjectsWidget'
import ContactWidget from './components/ContactWidget'
import SkillsWidget from './components/SkillsWidget'
import GamesWidget from './components/GamesWidget'

const GRID_SIZE = 45
const GRID_OFFSET_X = GRID_SIZE * 0.36  // 16.2px
const GRID_OFFSET_Y = GRID_SIZE * 0.32  // 14.4px
const WIDGET_PADDING = 12  // Padding from grid lines - increase this value for more distance
const COOKIE_NAME = 'widgetLayout'

// Cookie helper functions
const setCookie = (name, value, days = 365) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/`
}

const getCookie = (name) => {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) {
      try {
        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)))
      } catch (e) {
        return null
      }
    }
  }
  return null
}

// Snap a coordinate to the nearest grid line with padding (inside the grid cell)
const snapToGrid = (coord, offset) => {
  const adjusted = coord - offset
  const snapped = Math.round(adjusted / GRID_SIZE) * GRID_SIZE
  return snapped + offset + WIDGET_PADDING
}

// Snap a size to fit within grid cells (accounting for padding on both sides)
// Size should be: (grid_units * GRID_SIZE) - (padding * 2)
// Minimum size is 3x3 grid units
const MIN_GRID_UNITS = 3
const snapSizeToGrid = (size) => {
  // Add padding to both sides to get the total space needed
  const sizeWithPadding = size + (WIDGET_PADDING * 2)
  // Snap to grid units, with minimum of 2 units
  const gridUnits = Math.max(MIN_GRID_UNITS, Math.round(sizeWithPadding / GRID_SIZE))
  // Return size minus padding on both sides
  return (gridUnits * GRID_SIZE) - (WIDGET_PADDING * 2)
}

// Check if two rectangles overlap
const checkCollision = (rect1, rect2) => {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  )
}

// Check if a rectangle collides with any widget (excluding the active widget)
const hasCollisionWithOthers = (rect, widgets, excludeId) => {
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

// Constrain widget position to viewport boundaries
const constrainToViewport = (x, y, width, height) => {
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
const constrainSizeToViewport = (x, y, width, height) => {
  const maxWidth = window.innerWidth - x - (WIDGET_PADDING * 2)
  const maxHeight = window.innerHeight - y - (WIDGET_PADDING * 2)
  const minSize = (MIN_GRID_UNITS * GRID_SIZE) - (WIDGET_PADDING * 2)
  
  return {
    width: Math.max(minSize, Math.min(maxWidth, width)),
    height: Math.max(minSize, Math.min(maxHeight, height))
  }
}

// Find nearest valid position for a widget (spiral search from desired position)
const findNearestValidPosition = (desiredX, desiredY, width, height, widgets, excludeId) => {
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
const findValidSize = (desiredX, desiredY, desiredWidth, desiredHeight, widgets, excludeId, originalWidth, originalHeight) => {
  const snappedWidth = snapSizeToGrid(desiredWidth)
  const snappedHeight = snapSizeToGrid(desiredHeight)
  
  // Check if snapped size is valid
  const snappedRect = { x: desiredX, y: desiredY, width: snappedWidth, height: snappedHeight }
  if (!hasCollisionWithOthers(snappedRect, widgets, excludeId)) {
    return { width: snappedWidth, height: snappedHeight }
  }
  
  // Try reducing size incrementally
  // Try reducing width first
  for (let gridUnits = Math.floor((snappedWidth + WIDGET_PADDING * 2) / GRID_SIZE) - 1; 
       gridUnits >= MIN_GRID_UNITS; 
       gridUnits--) {
    const testWidth = (gridUnits * GRID_SIZE) - (WIDGET_PADDING * 2)
    const testRect = { x: desiredX, y: desiredY, width: testWidth, height: snappedHeight }
    if (!hasCollisionWithOthers(testRect, widgets, excludeId)) {
      return { width: testWidth, height: snappedHeight }
    }
  }
  
  // Try reducing height
  for (let gridUnits = Math.floor((snappedHeight + WIDGET_PADDING * 2) / GRID_SIZE) - 1; 
       gridUnits >= MIN_GRID_UNITS; 
       gridUnits--) {
    const testHeight = (gridUnits * GRID_SIZE) - (WIDGET_PADDING * 2)
    const testRect = { x: desiredX, y: desiredY, width: snappedWidth, height: testHeight }
    if (!hasCollisionWithOthers(testRect, widgets, excludeId)) {
      return { width: snappedWidth, height: testHeight }
    }
  }
  
  // Try reducing both
  for (let wGridUnits = Math.floor((snappedWidth + WIDGET_PADDING * 2) / GRID_SIZE) - 1; 
       wGridUnits >= MIN_GRID_UNITS; 
       wGridUnits--) {
    for (let hGridUnits = Math.floor((snappedHeight + WIDGET_PADDING * 2) / GRID_SIZE) - 1; 
         hGridUnits >= MIN_GRID_UNITS; 
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

function App() {
  // Component mapping
  const componentMap = {
    profile: ProfileWidget,
    about: AboutWidget,
    projects: ProjectsWidget,
    skills: SkillsWidget,
    contact: ContactWidget,
    games: GamesWidget
  }

  // Initialize widget positions - load from cookie or use defaults
  const [widgets, setWidgets] = useState(() => {
    // Try to load from cookie
    const savedLayout = getCookie(COOKIE_NAME)
    
    if (savedLayout && Array.isArray(savedLayout)) {
      // Restore from cookie, ensuring components are mapped correctly and constrained to viewport
      const restoredWidgets = savedLayout.map(widget => {
        const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height)
        const constrainedSize = constrainSizeToViewport(constrainedPos.x, constrainedPos.y, widget.width, widget.height)
      return {
        ...widget,
        x: constrainedPos.x,
        y: constrainedPos.y,
        width: constrainedSize.width,
        height: constrainedSize.height,
        component: componentMap[widget.type] || componentMap[widget.id],
        locked: widget.locked || false
      }
      })
      
      // Check if games widget exists in saved layout, if not add it
      const hasGamesWidget = restoredWidgets.some(w => w.id === 'games' || w.type === 'games')
      if (!hasGamesWidget) {
        // Add games widget at a safe position
        const gamesWidth = snapSizeToGrid(270)
        const gamesHeight = snapSizeToGrid(180)
        const gamesX = snapToGrid(20, GRID_OFFSET_X)
        const gamesY = snapToGrid(20, GRID_OFFSET_Y)
        
        restoredWidgets.push({
          id: 'games',
          type: 'games',
          x: gamesX,
          y: gamesY,
          width: gamesWidth,
          height: gamesHeight,
          component: GamesWidget
        })
      }
      
      return restoredWidgets
    }
    
    // Default layout
    const baseX = snapToGrid(100, GRID_OFFSET_X)
    const baseY = snapToGrid(100, GRID_OFFSET_Y)
    
    // Calculate widget sizes first
    const profileWidth = snapSizeToGrid(270) // 6 grid units
    const profileHeight = snapSizeToGrid(180) // 4 grid units
    const aboutWidth = snapSizeToGrid(225) // 5 grid units
    const aboutHeight = snapSizeToGrid(180) // 4 grid units
    const projectsWidth = snapSizeToGrid(270) // 6 grid units
    const projectsHeight = snapSizeToGrid(225) // 5 grid units
    const skillsWidth = snapSizeToGrid(225) // 5 grid units
    const skillsHeight = snapSizeToGrid(135) // 3 grid units
    const contactWidth = snapSizeToGrid(225) // 5 grid units
    const contactHeight = snapSizeToGrid(90) // 2 grid units
    const gamesWidth = snapSizeToGrid(270) // 6 grid units
    const gamesHeight = snapSizeToGrid(180) // 4 grid units
    
    // Calculate positions, ensuring they snap to grid
    const aboutX = baseX + profileWidth + GRID_SIZE
    const aboutXSnapped = snapToGrid(aboutX, GRID_OFFSET_X)
    
    const projectsY = baseY + profileHeight + GRID_SIZE
    const projectsYSnapped = snapToGrid(projectsY, GRID_OFFSET_Y)
    
    const skillsX = aboutXSnapped
    const skillsY = projectsYSnapped
    const skillsYSnapped = snapToGrid(skillsY, GRID_OFFSET_Y)
    
    const contactX = skillsX
    const contactY = skillsYSnapped + skillsHeight + GRID_SIZE
    const contactYSnapped = snapToGrid(contactY, GRID_OFFSET_Y)
    
    // Place games widget to the right of projects widget for better visibility
    const gamesX = baseX + projectsWidth + GRID_SIZE
    const gamesXSnapped = snapToGrid(gamesX, GRID_OFFSET_X)
    const gamesY = projectsYSnapped
    const gamesYSnapped = snapToGrid(gamesY, GRID_OFFSET_Y)
    
    // If games widget would overflow, place it below instead
    const gamesRightEdge = gamesXSnapped + gamesWidth
    const finalGamesX = gamesRightEdge > window.innerWidth - 50 ? baseX : gamesXSnapped
    const finalGamesY = gamesRightEdge > window.innerWidth - 50 
      ? snapToGrid(projectsYSnapped + projectsHeight + GRID_SIZE, GRID_OFFSET_Y)
      : gamesYSnapped
    
    return [
    {
      id: 'profile',
        type: 'profile',
        x: baseX,
        y: baseY,
        width: profileWidth,
        height: profileHeight,
        component: ProfileWidget,
        locked: false
      },
      {
        id: 'about',
        type: 'about',
        x: aboutXSnapped,
        y: baseY,
        width: aboutWidth,
        height: aboutHeight,
        component: AboutWidget
      },
      {
        id: 'projects',
        type: 'projects',
        x: baseX,
        y: projectsYSnapped,
        width: projectsWidth,
        height: projectsHeight,
        component: ProjectsWidget
      },
      {
        id: 'skills',
        type: 'skills',
        x: skillsX,
        y: skillsYSnapped,
        width: skillsWidth,
        height: skillsHeight,
        component: SkillsWidget
      },
      {
        id: 'contact',
        type: 'contact',
        x: contactX,
        y: contactYSnapped,
        width: contactWidth,
        height: contactHeight,
        component: ContactWidget
      },
      {
        id: 'games',
        type: 'games',
        x: finalGamesX,
        y: finalGamesY,
        width: gamesWidth,
        height: gamesHeight,
        component: GamesWidget
      }
    ]
  })

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [collisionWidgetId, setCollisionWidgetId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null) // { widgetId, x, y }
  const dragStateRef = useRef({
    activeId: null,
    startX: 0,
    startY: 0,
    widgetStartX: 0,
    widgetStartY: 0
  })
  const resizeStateRef = useRef({
    activeId: null,
    handle: null, // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
    startX: 0,
    startY: 0,
    widgetStartX: 0,
    widgetStartY: 0,
    widgetStartWidth: 0,
    widgetStartHeight: 0
  })

  const handleMouseDown = (e, id) => {
    // Handle right-click for context menu
    if (e.button === 2) {
      e.preventDefault()
      const widget = widgets.find(w => w.id === id)
      if (!widget) return
      
      setContextMenu({
        widgetId: id,
        x: e.clientX,
        y: e.clientY
      })
      return
    }
    
    if (e.button !== 0) return
    
    const widget = widgets.find(w => w.id === id)
    if (!widget) return
    
    // Don't allow dragging/resizing locked widgets
    if (widget.locked) return

    // Check if clicking on a resize handle
    const handle = e.target.dataset.handle
    if (handle) {
      resizeStateRef.current = {
        activeId: id,
        handle: handle,
        startX: e.clientX,
        startY: e.clientY,
        widgetStartX: widget.x,
        widgetStartY: widget.y,
        widgetStartWidth: widget.width,
        widgetStartHeight: widget.height
      }
      setIsResizing(true)
    } else {
      dragStateRef.current = {
        activeId: id,
        startX: e.clientX,
        startY: e.clientY,
        widgetStartX: widget.x,
        widgetStartY: widget.y
      }
      setIsDragging(true)
    }

    e.preventDefault()
    e.stopPropagation()
  }

  const handleMouseMove = (e) => {
    // Handle resizing - allow free movement during resize
    if (resizeStateRef.current.activeId) {
      const { handle, startX, startY, widgetStartX, widgetStartY, widgetStartWidth, widgetStartHeight } = resizeStateRef.current
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      setWidgets(prev => {
        const activeWidget = prev.find(w => w.id === resizeStateRef.current.activeId)
        if (!activeWidget) return prev

        let newX = widgetStartX
        let newY = widgetStartY
        let newWidth = widgetStartWidth
        let newHeight = widgetStartHeight

        // Handle horizontal resizing
        if (handle.includes('e')) {
          newWidth = widgetStartWidth + deltaX
        } else if (handle.includes('w')) {
          newWidth = widgetStartWidth - deltaX
          newX = widgetStartX + deltaX
        }

        // Handle vertical resizing
        if (handle.includes('s')) {
          newHeight = widgetStartHeight + deltaY
        } else if (handle.includes('n')) {
          newHeight = widgetStartHeight - deltaY
          newY = widgetStartY + deltaY
        }

        // Ensure minimum size (at least 3x3 grid units minus padding on both sides)
        const minSize = (MIN_GRID_UNITS * GRID_SIZE) - (WIDGET_PADDING * 2)
        newWidth = Math.max(minSize, newWidth)
        newHeight = Math.max(minSize, newHeight)

        // Constrain size to viewport
        const constrainedSize = constrainSizeToViewport(newX, newY, newWidth, newHeight)
        newWidth = constrainedSize.width
        newHeight = constrainedSize.height

        // Constrain position to viewport (in case resize moved it out)
        const constrainedPos = constrainToViewport(newX, newY, newWidth, newHeight)
        newX = constrainedPos.x
        newY = constrainedPos.y

        // Allow free movement during resize - no collision checking
        return prev.map(w => 
          w.id === activeWidget.id
            ? { ...w, x: newX, y: newY, width: newWidth, height: newHeight }
            : w
        )
      })
      return
    }

    // Handle dragging - allow free movement during drag, but constrain to viewport
    if (dragStateRef.current.activeId) {
      const { startX, startY, widgetStartX, widgetStartY } = dragStateRef.current
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      setWidgets(prev => {
        const activeWidget = prev.find(w => w.id === dragStateRef.current.activeId)
        if (!activeWidget) return prev

        let newX = widgetStartX + deltaX
        let newY = widgetStartY + deltaY

        // Constrain to viewport
        const constrained = constrainToViewport(newX, newY, activeWidget.width, activeWidget.height)
        
        return prev.map(w => 
          w.id === activeWidget.id
            ? { ...w, x: constrained.x, y: constrained.y }
            : w
        )
      })
    }
  }

  const handleMouseUp = useCallback(() => {
    // Clear collision state
    setCollisionWidgetId(null)
    
    // Handle resize end
    if (resizeStateRef.current.activeId) {
      const activeId = resizeStateRef.current.activeId
      setIsResizing(false)
      
      // Snap widget position and size to grid
      setWidgets(prev => {
        const widget = prev.find(w => w.id === activeId)
        if (widget) {
          const { handle, widgetStartX, widgetStartY, widgetStartWidth, widgetStartHeight } = resizeStateRef.current
          const snappedWidth = snapSizeToGrid(widget.width)
          const snappedHeight = snapSizeToGrid(widget.height)
          
          // Calculate final position based on which handle was used
          let finalX = widget.x
          let finalY = widget.y
          
          if (handle.includes('w')) {
            // Resizing from left: adjust x position
            const widthChange = snappedWidth - widgetStartWidth
            finalX = widgetStartX - widthChange
          } else {
            // Resizing from right: keep x as is
            finalX = widget.x
          }
          
          if (handle.includes('n')) {
            // Resizing from top: adjust y position
            const heightChange = snappedHeight - widgetStartHeight
            finalY = widgetStartY - heightChange
          } else {
            // Resizing from bottom: keep y as is
            finalY = widget.y
          }
          
          // Snap final position to grid
          finalX = snapToGrid(finalX, GRID_OFFSET_X)
          finalY = snapToGrid(finalY, GRID_OFFSET_Y)
          
          // Constrain size to viewport
          const constrainedSize = constrainSizeToViewport(finalX, finalY, snappedWidth, snappedHeight)
          const finalWidth = constrainedSize.width
          const finalHeight = constrainedSize.height
          
          // Constrain position to viewport
          const constrainedPos = constrainToViewport(finalX, finalY, finalWidth, finalHeight)
          finalX = constrainedPos.x
          finalY = constrainedPos.y
          
          // Check for collisions and find valid size if needed
          const finalRect = {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight
          }
          
          if (hasCollisionWithOthers(finalRect, prev, activeId)) {
            // Try to find a valid size (reduce if needed)
            const validSize = findValidSize(
              finalX, 
              finalY, 
              finalWidth, 
              finalHeight, 
              prev, 
              activeId,
              widgetStartWidth,
              widgetStartHeight
            )
            
            // Constrain valid size to viewport
            const constrainedValidSize = constrainSizeToViewport(finalX, finalY, validSize.width, validSize.height)
            validSize.width = constrainedValidSize.width
            validSize.height = constrainedValidSize.height
            
            // Show collision feedback if size was reduced
            if (validSize.width !== finalWidth || validSize.height !== finalHeight) {
              setCollisionWidgetId(activeId)
              setTimeout(() => setCollisionWidgetId(null), 300)
            }
            
            // If size was reduced, recalculate position if needed
            let adjustedX = finalX
            let adjustedY = finalY
            
            if (handle.includes('w')) {
              const widthChange = validSize.width - widgetStartWidth
              adjustedX = widgetStartX - widthChange
              adjustedX = snapToGrid(adjustedX, GRID_OFFSET_X)
            }
            
            if (handle.includes('n')) {
              const heightChange = validSize.height - widgetStartHeight
              adjustedY = widgetStartY - heightChange
              adjustedY = snapToGrid(adjustedY, GRID_OFFSET_Y)
            }
            
            // Constrain adjusted position to viewport
            const constrainedAdjustedPos = constrainToViewport(adjustedX, adjustedY, validSize.width, validSize.height)
            adjustedX = constrainedAdjustedPos.x
            adjustedY = constrainedAdjustedPos.y
            
            // Check if adjusted position still has collision
            const adjustedRect = {
              x: adjustedX,
              y: adjustedY,
              width: validSize.width,
              height: validSize.height
            }
            
            if (hasCollisionWithOthers(adjustedRect, prev, activeId)) {
              // Try to find nearest valid position
              const validPos = findNearestValidPosition(
                adjustedX,
                adjustedY,
                validSize.width,
                validSize.height,
                prev,
                activeId
              )
              
              // Show collision feedback if position was moved
              if (validPos.x !== adjustedX || validPos.y !== adjustedY) {
                setCollisionWidgetId(activeId)
                setTimeout(() => setCollisionWidgetId(null), 300)
              }
              
              return prev.map(w => {
                if (w.id === activeId) {
                  return {
                    ...w,
                    x: validPos.x,
                    y: validPos.y,
                    width: validSize.width,
                    height: validSize.height
                  }
                }
                return w
              })
            }
            
            return prev.map(w => {
              if (w.id === activeId) {
                return {
                  ...w,
                  x: adjustedX,
                  y: adjustedY,
                  width: validSize.width,
                  height: validSize.height
                }
              }
              return w
            })
          }
          
          return prev.map(w => {
            if (w.id === activeId) {
              return {
                ...w,
                x: finalX,
                y: finalY,
                width: finalWidth,
                height: finalHeight
              }
            }
            return w
          })
        }
        return prev
      })
      resizeStateRef.current.activeId = null
    }

    // Handle drag end
    if (dragStateRef.current.activeId) {
      const activeId = dragStateRef.current.activeId
      setIsDragging(false)
      
      // Snap the widget to the grid and find nearest valid position if collision
      setWidgets(prev => {
        const widget = prev.find(w => w.id === activeId)
        if (widget) {
          let snappedX = snapToGrid(widget.x, GRID_OFFSET_X)
          let snappedY = snapToGrid(widget.y, GRID_OFFSET_Y)
          
          // Constrain to viewport
          const constrained = constrainToViewport(snappedX, snappedY, widget.width, widget.height)
          snappedX = constrained.x
          snappedY = constrained.y
          
          // Check for collisions
          const snappedRect = {
            x: snappedX,
            y: snappedY,
            width: widget.width,
            height: widget.height
          }
          
          if (hasCollisionWithOthers(snappedRect, prev, activeId)) {
            // Find nearest valid position
            const validPos = findNearestValidPosition(
              snappedX,
              snappedY,
              widget.width,
              widget.height,
              prev,
              activeId
            )
            
            // Show collision feedback if position was moved
            if (validPos.x !== snappedX || validPos.y !== snappedY) {
              setCollisionWidgetId(activeId)
              setTimeout(() => setCollisionWidgetId(null), 300)
            }
            
            return prev.map(w => {
              if (w.id === activeId) {
                return {
                  ...w,
                  x: validPos.x,
                  y: validPos.y
                }
              }
              return w
            })
          }
          
          return prev.map(w => {
            if (w.id === activeId) {
              return {
                ...w,
                x: snappedX,
                y: snappedY
              }
            }
            return w
          })
        }
        return prev
      })
      dragStateRef.current.activeId = null
    }
  }, [])

  // Toggle lock on widget
  const toggleLockWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, locked: !w.locked } : w
    ))
    setContextMenu(null)
  }, [])

  // Autosort widgets in a puzzle-like layout (no gaps, tight packing)
  const autosortWidgets = useCallback(() => {
    const padding = 20
    const startX = snapToGrid(padding, GRID_OFFSET_X)
    const startY = snapToGrid(padding, GRID_OFFSET_Y)
    
    // Separate locked and unlocked widgets
    const lockedWidgets = widgets.filter(w => w.locked)
    const unlockedWidgets = widgets.filter(w => !w.locked)
    
    // Sort unlocked widgets by area (largest first) for better packing
    const sortedUnlocked = [...unlockedWidgets].sort((a, b) => {
      const areaA = a.width * a.height
      const areaB = b.width * b.height
      return areaB - areaA
    })
    
    // Track occupied areas (from locked widgets)
    const occupiedRects = lockedWidgets.map(w => ({
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
      const newWidgets = [...lockedWidgets]
      
      // Place each unlocked widget in the best available position
      sortedUnlocked.forEach(widget => {
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
  }, [widgets])

  // Save to cookie whenever widgets change
  useEffect(() => {
    // Only save position and size data, not component references
    const layoutToSave = widgets.map(({ id, type, x, y, width, height, locked }) => ({
      id,
      type,
      x,
      y,
      width,
      height,
      locked: locked || false
    }))
    setCookie(COOKIE_NAME, layoutToSave)
  }, [widgets])

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null)
    }
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('contextmenu', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('contextmenu', handleClickOutside)
    }
  }, [])

  // Attach global mouse events
  useEffect(() => {
    const handleGlobalMove = (e) => handleMouseMove(e)
    const handleGlobalUp = () => handleMouseUp()

    document.addEventListener('mousemove', handleGlobalMove)
    document.addEventListener('mouseup', handleGlobalUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMove)
      document.removeEventListener('mouseup', handleGlobalUp)
    }
  }, [handleMouseUp])

  return (
    <div className="app" onContextMenu={(e) => e.preventDefault()}>
      {/* Autosort button */}
      <button 
        className="autosort-button"
        onClick={autosortWidgets}
        title="Auto-sort widgets"
      >
        ↻ Sort
      </button>
      
      {/* Context menu */}
      {contextMenu && (
        <div 
          className="context-menu"
        style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={() => toggleLockWidget(contextMenu.widgetId)}
          >
            {widgets.find(w => w.id === contextMenu.widgetId)?.locked ? '🔓 Unlock' : '🔒 Lock'}
          </button>
        </div>
      )}
      
      <div className="grid-background"></div>
      {/* Overlay elements to hide grid lines behind widgets */}
        {widgets.map(widget => (
        <div
          key={`grid-mask-${widget.id}`}
          className="grid-mask"
          style={{
            left: `${widget.x}px`,
            top: `${widget.y}px`,
            width: `${widget.width}px`,
            height: `${widget.height}px`
          }}
        />
      ))}
      <div className="widget-container">
        {widgets.map(widget => {
          const isDraggingWidget = isDragging && dragStateRef.current.activeId === widget.id
          const isResizingWidget = isResizing && resizeStateRef.current.activeId === widget.id
          const hasCollision = collisionWidgetId === widget.id
          return (
            <div
            key={widget.id}
              className={`widget ${isDraggingWidget ? 'dragging' : ''} ${isResizingWidget ? 'resizing' : ''} ${hasCollision ? 'collision' : ''} ${widget.locked ? 'locked' : ''}`}
              style={{
                left: `${widget.x}px`,
                top: `${widget.y}px`,
                width: `${widget.width}px`,
                height: `${widget.height}px`
              }}
              onMouseDown={(e) => handleMouseDown(e, widget.id)}
            >
              <div className="widget-content">
                {(() => {
                  const Component = widget.component
                  return <Component />
                })()}
              </div>
              {/* Resize handles */}
              <div className="resize-handle resize-handle-n" data-handle="n"></div>
              <div className="resize-handle resize-handle-s" data-handle="s"></div>
              <div className="resize-handle resize-handle-e" data-handle="e"></div>
              <div className="resize-handle resize-handle-w" data-handle="w"></div>
              <div className="resize-handle resize-handle-ne" data-handle="ne"></div>
              <div className="resize-handle resize-handle-nw" data-handle="nw"></div>
              <div className="resize-handle resize-handle-se" data-handle="se"></div>
              <div className="resize-handle resize-handle-sw" data-handle="sw"></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App
