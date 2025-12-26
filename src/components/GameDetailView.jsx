import { useEffect, useCallback, useMemo, useRef } from 'react'
import { useWidgets } from '../hooks/useWidgets'
import { useDragAndResize } from '../hooks/useDragAndResize'
import { useAutosort } from '../hooks/useAutosort'
import { useContextMenu } from '../hooks/useContextMenu'
import { useToast } from '../hooks/useToast'
import { usePageTransition } from '../hooks/usePageTransition'
import ContextMenu from './WidgetSystem/ContextMenu'
import GridBackground from './WidgetSystem/GridBackground'
import GridMask from './WidgetSystem/GridMask'
import WidgetContainer from './WidgetSystem/WidgetContainer'
import Toaster from './Toaster'
import { snapToGrid, snapSizeToGrid, constrainToViewport, constrainSizeToViewport } from '../utils/grid'
import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, COOKIE_NAME_GAME_DETAIL, COOKIE_NAME_DEFAULT_GAME_DETAIL } from '../constants/grid'
import { getCookie, setCookie } from '../utils/cookies'
import BackButtonWidget from './GameDetailWidgets/BackButtonWidget'
import GameInfoWidget from './GameDetailWidgets/GameInfoWidget'
import GameDescriptionWidget from './GameDetailWidgets/GameDescriptionWidget'
import GameImageWidget from './GameDetailWidgets/GameImageWidget'
import GameDetailsWidget from './GameDetailWidgets/GameDetailsWidget'

/* eslint-disable react/prop-types */

export default function GameDetailView({ game, onBack }) {
  const [widgets, setWidgets] = useWidgets('game-detail')
  const initializedRef = useRef(false)
  const previousGameIdRef = useRef(null)
  const { animateInitial, animateWidgetsIn } = usePageTransition()
  const isInitialMountRef = useRef(true)
  
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

  // Initialize widgets layout on mount, then update game data when game changes
  useEffect(() => {
    if (!game) return

    const currentGameId = game.id
    const gameChanged = previousGameIdRef.current !== currentGameId
    previousGameIdRef.current = currentGameId

    // Check if there's a saved layout for game detail view
    const savedLayout = getCookie(COOKIE_NAME_GAME_DETAIL)
    const defaultLayout = getCookie(COOKIE_NAME_DEFAULT_GAME_DETAIL)
    
    // If we have existing widgets and the game changed, just update the game data in components
    // This preserves the layout when switching between games
    if (initializedRef.current && gameChanged) {
      // Use functional update to avoid dependency on widgets
      setWidgets(prevWidgets => {
        if (!prevWidgets || prevWidgets.length === 0) return prevWidgets
        return prevWidgets.map(widget => {
          // Update components with new game data
          if (widget.id === 'game-info' || widget.type === 'game-info') {
            return { ...widget, component: () => <GameInfoWidget game={game} /> }
          } else if (widget.id === 'game-description' || widget.type === 'game-description') {
            return { ...widget, component: () => <GameDescriptionWidget game={game} /> }
          } else if (widget.id === 'game-image' || widget.type === 'game-image') {
            return { ...widget, component: () => <GameImageWidget game={game} /> }
          } else if (widget.id === 'game-details' || widget.type === 'game-details') {
            return { ...widget, component: () => <GameDetailsWidget game={game} /> }
          } else if (widget.id === 'back-button' || widget.type === 'back-button') {
            return { ...widget, component: () => <BackButtonWidget onBack={onBack} /> }
          }
          return widget
        })
      })
      return
    }
    
    // If already initialized and game hasn't changed, don't re-initialize
    if (initializedRef.current && !gameChanged) {
      return
    }
    
    // Only initialize layout if we don't have widgets yet
    if (savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) {
      // Restore from saved layout
      const restoredWidgets = savedLayout.map(widget => {
        try {
          const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height)
          const constrainedSize = constrainSizeToViewport(constrainedPos.x, constrainedPos.y, widget.width, widget.height)
          
          // Map widget types to components
          let component = null
          if (widget.id === 'back-button' || widget.type === 'back-button') {
            component = () => <BackButtonWidget onBack={onBack} />
          } else if (widget.id === 'game-info' || widget.type === 'game-info') {
            component = () => <GameInfoWidget game={game} />
          } else if (widget.id === 'game-description' || widget.type === 'game-description') {
            component = () => <GameDescriptionWidget game={game} />
          } else if (widget.id === 'game-image' || widget.type === 'game-image') {
            component = () => <GameImageWidget game={game} />
          } else if (widget.id === 'game-details' || widget.type === 'game-details') {
            component = () => <GameDetailsWidget game={game} />
          }
          
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
      }).filter(widget => widget !== null)
      
      // Ensure back button exists and is locked
      const hasBackButton = restoredWidgets.some(w => w.id === 'back-button')
      if (!hasBackButton) {
        const backButtonWidth = snapSizeToGrid(120)
        const backButtonHeight = snapSizeToGrid(60)
        const backButtonX = snapToGrid(GRID_OFFSET_X, GRID_OFFSET_X)
        const backButtonY = snapToGrid(GRID_OFFSET_Y, GRID_OFFSET_Y)
        const constrainedBackButton = constrainToViewport(backButtonX, backButtonY, backButtonWidth, backButtonHeight)
        
        restoredWidgets.unshift({
          id: 'back-button',
          type: 'back-button',
          x: constrainedBackButton.x,
          y: constrainedBackButton.y,
          width: backButtonWidth,
          height: backButtonHeight,
          component: () => <BackButtonWidget onBack={onBack} />,
          locked: true,
          pinned: false
        })
      } else {
        // Ensure back button is locked and has correct component
        const backButton = restoredWidgets.find(w => w.id === 'back-button')
        if (backButton) {
          backButton.locked = true
          backButton.component = () => <BackButtonWidget onBack={onBack} />
        }
      }
      
      setWidgets(restoredWidgets)
      initializedRef.current = true
      return
    }
    
    // If no saved layout, try to load default layout
    if (defaultLayout && Array.isArray(defaultLayout) && defaultLayout.length > 0) {
      // Restore from default layout
      const restoredWidgets = defaultLayout.map(widget => {
        try {
          const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height)
          const constrainedSize = constrainSizeToViewport(constrainedPos.x, constrainedPos.y, widget.width, widget.height)
          
          // Map widget types to components
          let component = null
          if (widget.id === 'back-button' || widget.type === 'back-button') {
            component = () => <BackButtonWidget onBack={onBack} />
          } else if (widget.id === 'game-info' || widget.type === 'game-info') {
            component = () => <GameInfoWidget game={game} />
          } else if (widget.id === 'game-description' || widget.type === 'game-description') {
            component = () => <GameDescriptionWidget game={game} />
          } else if (widget.id === 'game-image' || widget.type === 'game-image') {
            component = () => <GameImageWidget game={game} />
          } else if (widget.id === 'game-details' || widget.type === 'game-details') {
            component = () => <GameDetailsWidget game={game} />
          }
          
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
      }).filter(widget => widget !== null)
      
      // Ensure back button exists and is locked
      const hasBackButton = restoredWidgets.some(w => w.id === 'back-button')
      if (!hasBackButton) {
        const backButtonWidth = snapSizeToGrid(120)
        const backButtonHeight = snapSizeToGrid(60)
        const backButtonX = snapToGrid(GRID_OFFSET_X, GRID_OFFSET_X)
        const backButtonY = snapToGrid(GRID_OFFSET_Y, GRID_OFFSET_Y)
        const constrainedBackButton = constrainToViewport(backButtonX, backButtonY, backButtonWidth, backButtonHeight)
        
        restoredWidgets.unshift({
          id: 'back-button',
          type: 'back-button',
          x: constrainedBackButton.x,
          y: constrainedBackButton.y,
          width: backButtonWidth,
          height: backButtonHeight,
          component: () => <BackButtonWidget onBack={onBack} />,
          locked: true,
          pinned: false
        })
      } else {
        // Ensure back button is locked and has correct component
        const backButton = restoredWidgets.find(w => w.id === 'back-button')
        if (backButton) {
          backButton.locked = true
          backButton.component = () => <BackButtonWidget onBack={onBack} />
        }
      }
      
      setWidgets(restoredWidgets)
      initializedRef.current = true
      return
    }

    // Create hardcoded default layout if no saved or default layout exists
    const backButtonWidth = snapSizeToGrid(120)
    const backButtonHeight = snapSizeToGrid(60)
    const backButtonX = snapToGrid(GRID_OFFSET_X, GRID_OFFSET_X)
    const backButtonY = snapToGrid(GRID_OFFSET_Y, GRID_OFFSET_Y)
    const constrainedBackButton = constrainToViewport(backButtonX, backButtonY, backButtonWidth, backButtonHeight)

    // Calculate positions for other widgets, snapping to grid
    const gameInfoX = snapToGrid(constrainedBackButton.x + backButtonWidth + GRID_SIZE, GRID_OFFSET_X)
    const gameInfoY = snapToGrid(GRID_OFFSET_Y, GRID_OFFSET_Y)
    const gameInfoWidth = snapSizeToGrid(250)
    const gameInfoHeight = snapSizeToGrid(180)
    const constrainedGameInfo = constrainToViewport(gameInfoX, gameInfoY, gameInfoWidth, gameInfoHeight)

    const gameDescriptionX = snapToGrid(constrainedGameInfo.x + gameInfoWidth + GRID_SIZE, GRID_OFFSET_X)
    const gameDescriptionY = snapToGrid(GRID_OFFSET_Y, GRID_OFFSET_Y)
    const gameDescriptionWidth = snapSizeToGrid(300)
    const gameDescriptionHeight = snapSizeToGrid(250)
    const constrainedGameDescription = constrainToViewport(gameDescriptionX, gameDescriptionY, gameDescriptionWidth, gameDescriptionHeight)

    const gameImageX = snapToGrid(GRID_OFFSET_X, GRID_OFFSET_X)
    const gameImageY = snapToGrid(constrainedBackButton.y + backButtonHeight + GRID_SIZE, GRID_OFFSET_Y)
    const gameImageWidth = snapSizeToGrid(400)
    const gameImageHeight = snapSizeToGrid(300)
    const constrainedGameImage = constrainToViewport(gameImageX, gameImageY, gameImageWidth, gameImageHeight)

    const gameDetailsX = snapToGrid(constrainedGameImage.x + gameImageWidth + GRID_SIZE, GRID_OFFSET_X)
    const gameDetailsY = snapToGrid(constrainedGameImage.y, GRID_OFFSET_Y)
    const gameDetailsWidth = snapSizeToGrid(200)
    const gameDetailsHeight = snapSizeToGrid(200)
    const constrainedGameDetails = constrainToViewport(gameDetailsX, gameDetailsY, gameDetailsWidth, gameDetailsHeight)

    const gameWidgets = [
      {
        id: 'back-button',
        type: 'back-button',
        x: constrainedBackButton.x,
        y: constrainedBackButton.y,
        width: backButtonWidth,
        height: backButtonHeight,
        component: () => <BackButtonWidget onBack={onBack} />,
        locked: true,
        pinned: false
      },
      {
        id: 'game-info',
        type: 'game-info',
        x: constrainedGameInfo.x,
        y: constrainedGameInfo.y,
        width: gameInfoWidth,
        height: gameInfoHeight,
        component: () => <GameInfoWidget game={game} />,
        locked: false,
        pinned: false
      },
      {
        id: 'game-description',
        type: 'game-description',
        x: constrainedGameDescription.x,
        y: constrainedGameDescription.y,
        width: gameDescriptionWidth,
        height: gameDescriptionHeight,
        component: () => <GameDescriptionWidget game={game} />,
        locked: false,
        pinned: false
      },
      {
        id: 'game-image',
        type: 'game-image',
        x: constrainedGameImage.x,
        y: constrainedGameImage.y,
        width: gameImageWidth,
        height: gameImageHeight,
        component: () => <GameImageWidget game={game} />,
        locked: false,
        pinned: false
      },
      {
        id: 'game-details',
        type: 'game-details',
        x: constrainedGameDetails.x,
        y: constrainedGameDetails.y,
        width: gameDetailsWidth,
        height: gameDetailsHeight,
        component: () => <GameDetailsWidget game={game} />,
        locked: false,
        pinned: false
      }
    ]

    setWidgets(gameWidgets)
    initializedRef.current = true
  }, [game, setWidgets, onBack])

  // Initial animation on mount or when widgets are first set
  useEffect(() => {
    if (isInitialMountRef.current && widgets.length > 0 && initializedRef.current) {
      isInitialMountRef.current = false
      setTimeout(() => {
        animateInitial()
      }, 100)
    } else if (widgets.length > 0 && initializedRef.current && !isInitialMountRef.current) {
      // Widgets updated, animate them in
      setTimeout(() => {
        animateWidgetsIn()
      }, 50)
    }
  }, [widgets, animateInitial, animateWidgetsIn])

  const validWidgets = useMemo(() => Array.isArray(widgets) ? widgets : [], [widgets])
  
  const autosortWidgets = useAutosort(widgets, setWidgets)
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu()
  const { toasts, showToast, removeToast } = useToast()

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

  const removeWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
    closeContextMenu()
  }, [setWidgets, closeContextMenu])

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
    setCookie(COOKIE_NAME_DEFAULT_GAME_DETAIL, layoutToSave)
    showToast('Current layout saved as default!')
  }, [widgets, showToast])

  const handleMouseDownWithContext = (e, id) => {
    if (e.button !== 2) {
      handleMouseDown(e, id)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    const target = e.target
    let widgetElement = target.closest('[data-widget-id]')
    if (!widgetElement) {
      widgetElement = target.closest('.widget')
    }
    const widgetId = widgetElement?.getAttribute('data-widget-id') || null
    openContextMenu(e, widgetId)
  }

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
        onAddWidget={() => {}}
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
      />
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

