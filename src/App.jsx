import { useEffect, useCallback, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useWidgets, componentMap } from './hooks/useWidgets'
import { useDragAndResize } from './hooks/useDragAndResize'
import { useAutosort } from './hooks/useAutosort'
import { useContextMenu } from './hooks/useContextMenu'
import { useView } from './hooks/useView'
import { useToast } from './hooks/useToast'
import { usePageTransition } from './hooks/usePageTransition'
import { useScreenFill } from './hooks/useScreenFill'
import ContextMenu from './components/WidgetSystem/ContextMenu'
import GridBackground from './components/WidgetSystem/GridBackground'
import GridMask from './components/WidgetSystem/GridMask'
import WidgetContainer from './components/WidgetSystem/WidgetContainer'
import GameDetailView from './components/GameDetailView'
import Toaster from './components/Toaster'
import { getWidgetMinSize, COOKIE_NAME_DEFAULT, COOKIE_NAME_DEFAULT_GAME_DETAIL, GRID_SIZE } from './constants/grid'
import { snapToGrid, snapSizeToGrid, constrainToViewport, constrainSizeToViewport } from './utils/grid'
import { findNearestValidPosition } from './utils/collision'
import { GRID_OFFSET_X, GRID_OFFSET_Y } from './constants/grid'
import { setCookie, getCookie } from './utils/cookies'
import ProfileWidget from './components/ProfileWidget'
import AboutWidget from './components/AboutWidget'
import SkillsWidget from './components/SkillsWidget'
import ContactWidget from './components/ContactWidget'
import GamesWidget from './components/GamesWidget'

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
  
  // Screen fill hook - only enable when not dragging/resizing
  useScreenFill(
    widgets, 
    setWidgets, 
    !isDragging && !isResizing && currentView === 'main'
  )

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

  // Revert to default layout
  const revertToDefault = useCallback(() => {
    // Try to load default layout from cookie
    const defaultLayout = getCookie(COOKIE_NAME_DEFAULT)
    if (defaultLayout && Array.isArray(defaultLayout) && defaultLayout.length > 0) {
      // Restore from default layout
      const restoredWidgets = defaultLayout
        .map(widget => {
          try {
            const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height)
            const constrainedSize = constrainSizeToViewport(constrainedPos.x, constrainedPos.y, widget.width, widget.height)
            const component = componentMap[widget.type] || componentMap[widget.id]
            
            if (!component) {
              console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
              return null
            }
            
            return {
              ...widget,
              x: constrainedPos.x,
              y: constrainedPos.y,
              width: constrainedSize.width,
              height: constrainedSize.height,
              component: component,
              locked: widget.locked || false,
              pinned: widget.pinned || false
            }
          } catch (error) {
            console.error(`Error restoring widget ${widget.id}:`, error)
            return null
          }
        })
        .filter(widget => widget !== null)
      
      // Check if games widget exists in default layout, if not add it
      const hasGamesWidget = restoredWidgets.some(w => w.id === 'games' || w.type === 'games')
      if (!hasGamesWidget) {
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
      
      setWidgets(restoredWidgets)
      showToast('Layout reverted to default!')
      return
    }
    
    // If no default layout, use hardcoded default
    const baseX = snapToGrid(100, GRID_OFFSET_X)
    const baseY = snapToGrid(100, GRID_OFFSET_Y)
    
    const profileSize = getWidgetMinSize('profile')
    const profileWidth = snapSizeToGrid(profileSize.width)
    const profileHeight = snapSizeToGrid(profileSize.height)
    
    const aboutSize = getWidgetMinSize('about')
    const aboutWidth = snapSizeToGrid(aboutSize.width)
    const aboutHeight = snapSizeToGrid(aboutSize.height)
    
    const skillsSize = getWidgetMinSize('skills')
    const skillsWidth = snapSizeToGrid(skillsSize.width)
    const skillsHeight = snapSizeToGrid(skillsSize.height)
    
    const contactSize = getWidgetMinSize('contact')
    const contactWidth = snapSizeToGrid(contactSize.width)
    const contactHeight = snapSizeToGrid(contactSize.height)
    
    const gamesSize = getWidgetMinSize('games')
    const gamesWidth = snapSizeToGrid(gamesSize.width)
    const gamesHeight = snapSizeToGrid(gamesSize.height)
    
    const aboutX = baseX + profileWidth + GRID_SIZE
    const aboutXSnapped = snapToGrid(aboutX, GRID_OFFSET_X)
    
    const skillsY = baseY + profileHeight + GRID_SIZE
    const skillsYSnapped = snapToGrid(skillsY, GRID_OFFSET_Y)
    
    const skillsX = aboutXSnapped
    const contactX = skillsX
    const contactY = skillsYSnapped + skillsHeight + GRID_SIZE
    const contactYSnapped = snapToGrid(contactY, GRID_OFFSET_Y)
    
    const gamesX = baseX
    const gamesXSnapped = snapToGrid(gamesX, GRID_OFFSET_X)
    const gamesY = skillsYSnapped
    const gamesYSnapped = snapToGrid(gamesY, GRID_OFFSET_Y)
    
    const defaultWidgets = [
      {
        id: 'profile',
        type: 'profile',
        x: baseX,
        y: baseY,
        width: profileWidth,
        height: profileHeight,
        component: ProfileWidget,
        locked: false,
        pinned: false
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
        x: gamesXSnapped,
        y: gamesYSnapped,
        width: gamesWidth,
        height: gamesHeight,
        component: GamesWidget
      }
    ]
    
    setWidgets(defaultWidgets)
    showToast('Layout reverted to default!')
  }, [setWidgets, showToast])

  // Add widget at position
  const addWidget = useCallback((widgetType, x, y) => {
    const Component = componentMap[widgetType]
    if (!Component) {
      console.warn(`Widget type ${widgetType} not found`)
      return
    }

    // Use flushSync to ensure the state update happens synchronously
    flushSync(() => {
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

        // Check if the click position is within reasonable bounds
        // If not, use a default position near existing widgets or at a safe location
        let targetX = x
        let targetY = y
        
        // If position is way off-screen or invalid, find a better default
        if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
          // Try to find a position near existing widgets
          if (prev.length > 0) {
            // Find the rightmost widget and place new widget to its right
            const rightmostWidget = prev.reduce((rightmost, w) => 
              (w.x + w.width) > (rightmost.x + rightmost.width) ? w : rightmost
            )
            targetX = rightmostWidget.x + rightmostWidget.width + GRID_SIZE
            targetY = rightmostWidget.y
          } else {
            // No widgets exist, use a safe default position
            targetX = snapToGrid(100, GRID_OFFSET_X)
            targetY = snapToGrid(100, GRID_OFFSET_Y)
          }
        }

        // Snap position to grid and constrain to viewport
        const snappedX = snapToGrid(targetX, GRID_OFFSET_X)
        const snappedY = snapToGrid(targetY, GRID_OFFSET_Y)
        const constrained = constrainToViewport(snappedX, snappedY, width, height)

        // Find nearest valid position that doesn't collide with existing widgets
        const validPosition = findNearestValidPosition(
          constrained.x,
          constrained.y,
          width,
          height,
          prev,
          null // No widget to exclude
        )

        // Create new widget - ensure all properties are set and create a new object
        const newWidget = {
          id: widgetType,
          type: widgetType,
          x: validPosition.x,
          y: validPosition.y,
          width: width,
          height: height,
          component: Component,
          locked: false,
          pinned: false
        }

        // Create a new array with the new widget to ensure React detects the change
        return [...prev, newWidget]
      })
    })
    
    // Animate the new widget in immediately
    setTimeout(() => {
      animateWidgetsIn()
    }, 50)
    
    // Close the context menu after state update
    closeContextMenu()
  }, [setWidgets, closeContextMenu, animateWidgetsIn])

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

  // Initialize default cookies if they don't exist
  useEffect(() => {
    const defaultLayout = getCookie(COOKIE_NAME_DEFAULT)
    if (!defaultLayout || !Array.isArray(defaultLayout) || defaultLayout.length === 0) {
      // Set default homepage layout (from useWidgets.js DEFAULT_HOMEPAGE_LAYOUT)
      const homepageDefault = [
        {"id":"profile","type":"profile","x":28.2,"y":26.4,"width":246,"height":111,"locked":false,"pinned":true},
        {"id":"about","type":"about","x":298.2,"y":26.4,"width":291,"height":111,"locked":false,"pinned":true},
        {"id":"contact","type":"contact","x":1288.2,"y":746.4,"width":239.79999999999995,"height":111,"locked":false,"pinned":true},
        {"id":"games","type":"games","x":28.2,"y":161.4,"width":561,"height":696,"locked":false,"pinned":true},
        {"id":"visitors","type":"visitors","x":1153.2,"y":746.4,"width":111,"height":111,"locked":false,"pinned":true},
        {"id":"time","type":"time","x":1288.2,"y":26.4,"width":239.79999999999995,"height":111,"locked":false,"pinned":true},
        {"id":"github","type":"github","x":1153.2,"y":161.4,"width":374.79999999999995,"height":561,"locked":false,"pinned":true},
        {"id":"skills","type":"skills","x":613.2,"y":791.4,"width":516,"height":66,"locked":false,"pinned":false},
        {"id":"apikey","type":"apikey","x":1018.2,"y":26.4,"width":246,"height":111,"locked":false,"pinned":true}
      ]
      setCookie(COOKIE_NAME_DEFAULT, homepageDefault)
    }
    
    // Also check game detail default
    const gameDetailDefault = getCookie(COOKIE_NAME_DEFAULT_GAME_DETAIL)
    if (!gameDetailDefault || !Array.isArray(gameDetailDefault) || gameDetailDefault.length === 0) {
      const gameDetailLayout = [
        {"id":"back-button","type":"back-button","x":28.2,"y":26.4,"width":111,"height":66,"locked":true,"pinned":false},
        {"id":"game-info","type":"game-info","x":613.2,"y":116.4,"width":246,"height":201,"locked":false,"pinned":false},
        {"id":"game-description","type":"game-description","x":1108.2,"y":116.4,"width":419.79999999999995,"height":201,"locked":false,"pinned":false},
        {"id":"game-image","type":"game-image","x":28.2,"y":116.4,"width":561,"height":741,"locked":false,"pinned":false},
        {"id":"game-details","type":"game-details","x":883.2,"y":116.4,"width":201,"height":201,"locked":false,"pinned":false}
      ]
      setCookie(COOKIE_NAME_DEFAULT_GAME_DETAIL, gameDetailLayout)
    }
  }, [])

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
        onRevertToDefault={revertToDefault}
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
