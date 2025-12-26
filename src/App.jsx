import { useEffect, useCallback, useMemo } from 'react'
import './App.css'
import { useWidgets, componentMap } from './hooks/useWidgets'
import { useDragAndResize } from './hooks/useDragAndResize'
import { useAutosort } from './hooks/useAutosort'
import { useContextMenu } from './hooks/useContextMenu'
import ContextMenu from './components/WidgetSystem/ContextMenu'
import GridBackground from './components/WidgetSystem/GridBackground'
import GridMask from './components/WidgetSystem/GridMask'
import WidgetContainer from './components/WidgetSystem/WidgetContainer'
import { getWidgetMinSize } from './constants/grid'
import { snapToGrid, snapSizeToGrid, constrainToViewport } from './utils/grid'
import { GRID_OFFSET_X, GRID_OFFSET_Y } from './constants/grid'

function App() {
  const [widgets, setWidgets] = useWidgets()
  
  // Ensure widgets is always an array
  const validWidgets = useMemo(() => Array.isArray(widgets) ? widgets : [], [widgets])
  const {
    isDragging,
    isResizing,
    collisionWidgetId,
    dragStateRef,
    resizeStateRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useDragAndResize(widgets, setWidgets)
  
  const autosortWidgets = useAutosort(widgets, setWidgets)
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu()

  // Toggle lock on widget (unpins if pinned)
  const toggleLockWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.map(w => {
      if (w.id === widgetId) {
        const newLocked = !w.locked
        return { ...w, locked: newLocked, pinned: newLocked ? false : w.pinned }
      }
      return w
    }))
    closeContextMenu()
  }, [setWidgets, closeContextMenu])

  // Toggle pin on widget (unlocks if locked)
  const togglePinWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.map(w => {
      if (w.id === widgetId) {
        const newPinned = !w.pinned
        return { ...w, pinned: newPinned, locked: newPinned ? false : w.locked }
      }
      return w
    }))
    closeContextMenu()
  }, [setWidgets, closeContextMenu])

  // Remove widget
  const removeWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
    closeContextMenu()
  }, [setWidgets, closeContextMenu])

  // Add widget at position
  const addWidget = useCallback((widgetType, x, y) => {
    const Component = componentMap[widgetType]
    if (!Component) {
      console.warn(`Widget type ${widgetType} not found`)
      return
    }

    // Check if widget already exists
    setWidgets(prev => {
      const existingWidget = prev.find(w => (w.type === widgetType || w.id === widgetType))
      if (existingWidget) {
        console.warn(`Widget ${widgetType} already exists`)
        return prev
      }

      // Get minimum size for widget
      const minSize = getWidgetMinSize(widgetType)
      const width = snapSizeToGrid(minSize.width)
      const height = snapSizeToGrid(minSize.height)

      // Snap position to grid and constrain to viewport
      const snappedX = snapToGrid(x, GRID_OFFSET_X)
      const snappedY = snapToGrid(y, GRID_OFFSET_Y)
      const constrained = constrainToViewport(snappedX, snappedY, width, height)

      // Create new widget
      const newWidget = {
        id: widgetType,
        type: widgetType,
        x: constrained.x,
        y: constrained.y,
        width: width,
        height: height,
        component: Component,
        locked: false,
        pinned: false
      }

      return [...prev, newWidget]
    })
  }, [setWidgets])

  // Handle mouse down (only for left-click drag, right-click handled by contextmenu)
  const handleMouseDownWithContext = (e, id) => {
    // Only handle left-click for dragging
    if (e.button !== 2) {
      handleMouseDown(e, id)
    }
  }

  // Handle right-click context menu (handles both widgets and empty space)
  const handleContextMenu = (e) => {
    e.preventDefault()
    const target = e.target
    const widgetElement = target.closest('.widget')
    const widgetId = widgetElement?.getAttribute('data-widget-id') || null
    openContextMenu(e, widgetId)
  }

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
  }, [handleMouseMove, handleMouseUp])

  return (
    <div className="app" onContextMenu={handleContextMenu}>
      <ContextMenu
        contextMenu={contextMenu}
        widgets={validWidgets}
        onToggleLock={toggleLockWidget}
        onTogglePin={togglePinWidget}
        onRemoveWidget={removeWidget}
        onSort={autosortWidgets}
        onAddWidget={addWidget}
        onClose={closeContextMenu}
      />
      
      <GridBackground />
      
      <GridMask widgets={widgets} />
      
      <WidgetContainer
        widgets={validWidgets}
        isDragging={isDragging}
        isResizing={isResizing}
        collisionWidgetId={collisionWidgetId}
        dragStateRef={dragStateRef}
        resizeStateRef={resizeStateRef}
        onMouseDown={handleMouseDownWithContext}
      />
    </div>
  )
}

export default App
