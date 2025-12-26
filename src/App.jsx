import { useEffect, useCallback, useMemo, useRef } from 'react'
import { useWidgets, componentMap } from './hooks/useWidgets'
import { useDragAndResize } from './hooks/useDragAndResize'
import { useAutosort } from './hooks/useAutosort'
import { useContextMenu } from './hooks/useContextMenu'
import { useView } from './hooks/useView'
import { useToast } from './hooks/useToast'
import { usePageTransition } from './hooks/usePageTransition'
import ContextMenu from './components/WidgetSystem/ContextMenu'
import GridBackground from './components/WidgetSystem/GridBackground'
import GridMask from './components/WidgetSystem/GridMask'
import WidgetContainer from './components/WidgetSystem/WidgetContainer'
import GameDetailView from './components/GameDetailView'
import Toaster from './components/Toaster'
import { getWidgetMinSize, COOKIE_NAME_DEFAULT } from './constants/grid'
import { snapToGrid, snapSizeToGrid, constrainToViewport } from './utils/grid'
import { GRID_OFFSET_X, GRID_OFFSET_Y } from './constants/grid'
import { setCookie } from './utils/cookies'

function App() {
  const { currentView, selectedGame, navigateToGameDetail: originalNavigateToGameDetail, navigateToMain: originalNavigateToMain, isLoading } = useView()
  const [widgets, setWidgets] = useWidgets('main')
  const { transition, animateInitial, animateWidgetsIn } = usePageTransition()
  const previousViewRef = useRef(currentView)
  const isInitialMountRef = useRef(true)
  
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
    handleMouseUp,
    wasLastInteractionDrag
  } = useDragAndResize(widgets, setWidgets)
  
  const autosortWidgets = useAutosort(widgets, setWidgets)
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu()
  const { toasts, showToast, removeToast } = useToast()

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

  // Set current layout as default
  const setAsDefault = useCallback(() => {
    const layoutToSave = widgets.map(({ id, type, x, y, width, height, locked, pinned }) => ({
      id,
      type,
      x,
      y,
      width,
      height,
      locked: locked || false,
      pinned: pinned || false
    }))
    setCookie(COOKIE_NAME_DEFAULT, layoutToSave)
    showToast('Current layout saved as default!')
  }, [widgets, showToast])

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
    // Look for element with data-widget-id attribute (widgets have this)
    let widgetElement = target.closest('[data-widget-id]')
    // If not found, also try looking for .widget class as fallback
    if (!widgetElement) {
      widgetElement = target.closest('.widget')
    }
    const widgetId = widgetElement?.getAttribute('data-widget-id') || null
    openContextMenu(e, widgetId)
  }

  // Wrapped navigation functions with transitions
  const navigateToGameDetail = useCallback(async (game) => {
    if (previousViewRef.current === 'main') {
      const animateIn = await transition()
      originalNavigateToGameDetail(game)
      await animateIn()
    } else {
      originalNavigateToGameDetail(game)
    }
    previousViewRef.current = 'game-detail'
  }, [transition, originalNavigateToGameDetail])

  const navigateToMain = useCallback(async () => {
    if (previousViewRef.current === 'game-detail') {
      const animateIn = await transition()
      originalNavigateToMain()
      await animateIn()
    } else {
      originalNavigateToMain()
    }
    previousViewRef.current = 'main'
  }, [transition, originalNavigateToMain])

  // Handle view changes for transitions
  useEffect(() => {
    if (previousViewRef.current !== currentView) {
      // View changed, but we already handled the transition in navigation functions
      // This is for browser back/forward navigation
      previousViewRef.current = currentView
      // Animate widgets in after a brief delay
      setTimeout(() => {
        animateWidgetsIn()
      }, 100)
    }
  }, [currentView, animateWidgetsIn])

  // Initial animation on mount
  useEffect(() => {
    if (isInitialMountRef.current && widgets.length > 0) {
      isInitialMountRef.current = false
      animateInitial()
    }
  }, [widgets, animateInitial])

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

  // Show loading state while fetching game from URL
  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'canvasText',
        fontSize: '1rem',
        opacity: 0.7
      }}>
        Loading...
      </div>
    )
  }

  // Show game detail view if selected
  if (currentView === 'game-detail' && selectedGame) {
    return <GameDetailView game={selectedGame} onBack={navigateToMain} />
  }

  return (
    <div 
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative'
      }}
      onContextMenu={handleContextMenu}
    >
      <ContextMenu
        contextMenu={contextMenu}
        widgets={validWidgets}
        onToggleLock={toggleLockWidget}
        onTogglePin={togglePinWidget}
        onRemoveWidget={removeWidget}
        onSort={autosortWidgets}
        onAddWidget={addWidget}
        onSetAsDefault={setAsDefault}
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
        wasLastInteractionDrag={wasLastInteractionDrag}
        onGameClick={navigateToGameDetail}
      />
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
