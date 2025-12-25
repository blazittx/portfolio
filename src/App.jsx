import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import ProfileWidget from './components/ProfileWidget'
import AboutWidget from './components/AboutWidget'
import ProjectsWidget from './components/ProjectsWidget'
import ContactWidget from './components/ContactWidget'
import SkillsWidget from './components/SkillsWidget'

const GRID_SIZE = 45
const GRID_OFFSET_X = GRID_SIZE * 0.36  // 16.2px
const GRID_OFFSET_Y = GRID_SIZE * 0.32  // 14.4px
const WIDGET_PADDING = 12  // Padding from grid lines - increase this value for more distance

// Snap a coordinate to the nearest grid line with padding (inside the grid cell)
const snapToGrid = (coord, offset) => {
  const adjusted = coord - offset
  const snapped = Math.round(adjusted / GRID_SIZE) * GRID_SIZE
  return snapped + offset + WIDGET_PADDING
}

// Snap a size to fit within grid cells (accounting for padding on both sides)
// Size should be: (grid_units * GRID_SIZE) - (padding * 2)
// Minimum size is 2x2 grid units
const MIN_GRID_UNITS = 2
const snapSizeToGrid = (size) => {
  // Add padding to both sides to get the total space needed
  const sizeWithPadding = size + (WIDGET_PADDING * 2)
  // Snap to grid units, with minimum of 2 units
  const gridUnits = Math.max(MIN_GRID_UNITS, Math.round(sizeWithPadding / GRID_SIZE))
  // Return size minus padding on both sides
  return (gridUnits * GRID_SIZE) - (WIDGET_PADDING * 2)
}

function App() {

  // Initialize widget positions snapped to grid
  const [widgets, setWidgets] = useState(() => {
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
    
    return [
      {
        id: 'profile',
        type: 'profile',
        x: baseX,
        y: baseY,
        width: profileWidth,
        height: profileHeight,
        component: ProfileWidget
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
      }
    ]
  })

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
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
    if (e.button !== 0) return
    
    const widget = widgets.find(w => w.id === id)
    if (!widget) return

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
    // Handle resizing
    if (resizeStateRef.current.activeId) {
      const { handle, startX, startY, widgetStartX, widgetStartY, widgetStartWidth, widgetStartHeight } = resizeStateRef.current
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      setWidgets(prev => prev.map(w => {
        if (w.id === resizeStateRef.current.activeId) {
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

          // Ensure minimum size (at least 2x2 grid units minus padding on both sides)
          const minSize = (MIN_GRID_UNITS * GRID_SIZE) - (WIDGET_PADDING * 2)
          newWidth = Math.max(minSize, newWidth)
          newHeight = Math.max(minSize, newHeight)

          return { ...w, x: newX, y: newY, width: newWidth, height: newHeight }
        }
        return w
      }))
      return
    }

    // Handle dragging
    if (dragStateRef.current.activeId) {
      const { startX, startY, widgetStartX, widgetStartY } = dragStateRef.current
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      setWidgets(prev => prev.map(w => 
        w.id === dragStateRef.current.activeId
          ? { ...w, x: widgetStartX + deltaX, y: widgetStartY + deltaY }
          : w
      ))
    }
  }

  const handleMouseUp = useCallback(() => {
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
          
          return prev.map(w => {
            if (w.id === activeId) {
              return {
                ...w,
                x: finalX,
                y: finalY,
                width: snappedWidth,
                height: snappedHeight
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
      
      // Snap the widget to the grid when dragging ends
      setWidgets(prev => {
        const widget = prev.find(w => w.id === activeId)
        if (widget) {
          const snappedX = snapToGrid(widget.x, GRID_OFFSET_X)
          const snappedY = snapToGrid(widget.y, GRID_OFFSET_Y)
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
    <div className="app">
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
          return (
            <div
              key={widget.id}
              className={`widget ${isDraggingWidget ? 'dragging' : ''} ${isResizingWidget ? 'resizing' : ''}`}
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
