import { useEffect, useCallback, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
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
import { snapToGrid, snapSizeToGrid, constrainToViewport, constrainSizeToViewport, calculateCenterOffset } from '../utils/grid'
import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, COOKIE_NAME_GAME_DETAIL, COOKIE_NAME_DEFAULT_GAME_DETAIL, COOKIE_NAME_DEFAULT_GAME_DETAIL_MOBILE } from '../constants/grid'
import { getCookie, setCookie } from '../utils/cookies'
import { DEFAULT_GAME_DETAIL_LAYOUT, DEFAULT_GAME_DETAIL_LAYOUT_MOBILE } from '../utils/setDefaultLayouts'
import { isMobile } from '../utils/mobile'
import BackButtonWidget from './GameDetailWidgets/BackButtonWidget'
import GameInfoWidget from './GameDetailWidgets/GameInfoWidget'
import GameDescriptionWidget from './GameDetailWidgets/GameDescriptionWidget'
import GameImageWidget from './GameDetailWidgets/GameImageWidget'
import GameDetailsWidget from './GameDetailWidgets/GameDetailsWidget'
import GameDevelopmentInfoWidget from './GameDetailWidgets/GameDevelopmentInfoWidget'
import { getWidgetMinSize } from '../constants/grid'

// Component map for game detail widgets
const gameDetailComponentMap = {
  'back-button': BackButtonWidget,
  'game-info': GameInfoWidget,
  'game-description': GameDescriptionWidget,
  'game-image': GameImageWidget,
  'game-details': GameDetailsWidget,
  'game-development-info': GameDevelopmentInfoWidget,
}

/* eslint-disable react/prop-types */

export default function GameDetailView({ game, onBack }) {
  const [widgets, setWidgets] = useWidgets('game-detail')
  const initializedRef = useRef(false)
  const previousGameIdRef = useRef(null)
  const { animateInitial, animateWidgetsIn } = usePageTransition()
  const isInitialMountRef = useRef(true)
  const previousWidgetsLengthRef = useRef(0)
  const previousWidgetIdsRef = useRef([])
  
  // Calculate center offset to center the layout horizontally and vertically
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [isMobileState, setIsMobileState] = useState(() => isMobile())
  const previousMobileStateRef = useRef(isMobileState)
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      const currentMobile = isMobile()
      setIsMobileState(currentMobile)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const centerOffset = useMemo(() => {
    return calculateCenterOffset()
  }, [windowSize])
  
  const {
    isDragging,
    isResizing,
    collisionWidgetId,
    dragStateRef,
    resizeStateRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useDragAndResize(widgets, setWidgets, centerOffset)

  // Initialize widgets layout on mount, then update game data when game changes
  useEffect(() => {
    if (!game) return

    const currentGameId = game.id
    const gameChanged = previousGameIdRef.current !== currentGameId
    previousGameIdRef.current = currentGameId

    // Check if there's a saved layout for game detail view
    const savedLayout = getCookie(COOKIE_NAME_GAME_DETAIL)
    const mobile = isMobile()
    const defaultCookieName = mobile ? COOKIE_NAME_DEFAULT_GAME_DETAIL_MOBILE : COOKIE_NAME_DEFAULT_GAME_DETAIL
    const defaultLayout = getCookie(defaultCookieName)
    
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
          } else if (widget.id === 'game-development-info' || widget.type === 'game-development-info') {
            return { ...widget, component: () => <GameDevelopmentInfoWidget game={game} /> }
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
    
    // On mobile, always use default layout - ignore saved cookies
    // Only initialize layout if we don't have widgets yet
    if (!mobile && savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) {
      // Restore from saved layout
      const restoredWidgets = savedLayout.map(widget => {
        try {
          // Don't enforce usable area bounds when loading saved layouts - just ensure visibility
          const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height, { x: 0, y: 0 }, false)
          const constrainedSize = constrainSizeToViewport(constrainedPos.x, constrainedPos.y, widget.width, widget.height, 0, 0, { x: 0, y: 0 })
          
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
          } else if (widget.id === 'game-development-info' || widget.type === 'game-development-info') {
            component = () => <GameDevelopmentInfoWidget game={game} />
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
        const constrainedBackButton = constrainToViewport(backButtonX, backButtonY, backButtonWidth, backButtonHeight, { x: 0, y: 0 }, false)
        
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
      // Restore from default layout - use exact positions without constraining
      const restoredWidgets = defaultLayout.map(widget => {
        try {
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
          } else if (widget.id === 'game-development-info' || widget.type === 'game-development-info') {
            component = () => <GameDevelopmentInfoWidget game={game} />
          }
          
          if (!component) {
            console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
            return null
          }
          
          // Use EXACT saved sizes and positions from default layout - don't constrain or modify
          return {
            ...widget,
            x: widget.x,
            y: widget.y,
            width: widget.width,
            height: widget.height,
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
        const constrainedBackButton = constrainToViewport(backButtonX, backButtonY, backButtonWidth, backButtonHeight, { x: 0, y: 0 }, false)
        
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

    // Use hardcoded default layout from user's current setup
    const gameWidgets = DEFAULT_GAME_DETAIL_LAYOUT.map(widget => {
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
        console.error(`Error creating widget ${widget.id}:`, error)
        return null
      }
    }).filter(widget => widget !== null)

    setWidgets(gameWidgets)
    initializedRef.current = true
  }, [game, setWidgets, onBack, centerOffset])
  
  // Switch layouts when mobile state changes - uses same logic as revertToDefault
  useEffect(() => {
    if (!game) return
    
    const previousMobile = previousMobileStateRef.current
    const currentMobile = isMobileState
    
    // Only reload if mobile state actually changed and we're already initialized
    if (previousMobile !== currentMobile && initializedRef.current) {
      previousMobileStateRef.current = currentMobile
      
      // Small delay to ensure viewport has updated after resize
      setTimeout(() => {
        // Use the same logic as revertToDefault
        const mobile = isMobile() // Re-check mobile state after delay
        const defaultCookieName = mobile ? COOKIE_NAME_DEFAULT_GAME_DETAIL_MOBILE : COOKIE_NAME_DEFAULT_GAME_DETAIL
        const defaultLayout = getCookie(defaultCookieName)
      
      if (defaultLayout && Array.isArray(defaultLayout) && defaultLayout.length > 0) {
        // Restore from default layout - use exact positions without constraining
        const restoredWidgets = defaultLayout.map(widget => {
          try {
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
            } else if (widget.id === 'game-development-info' || widget.type === 'game-development-info') {
              component = () => <GameDevelopmentInfoWidget game={game} />
            }
            
            if (!component) {
              console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
              return null
            }
            
            // Use EXACT saved sizes and positions from default layout - don't constrain or modify
            return {
              ...widget,
              x: widget.x,
              y: widget.y,
              width: widget.width,
              height: widget.height,
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
          
          restoredWidgets.unshift({
            id: 'back-button',
            type: 'back-button',
            x: backButtonX,
            y: backButtonY,
            width: backButtonWidth,
            height: backButtonHeight,
            component: () => <BackButtonWidget onBack={onBack} />,
            locked: true,
            pinned: false
          })
        } else {
          const backButton = restoredWidgets.find(w => w.id === 'back-button')
          if (backButton) {
            backButton.locked = true
            backButton.component = () => <BackButtonWidget onBack={onBack} />
          }
        }
        
        // Use flushSync to ensure the state update happens synchronously
        flushSync(() => {
          setWidgets(restoredWidgets)
        })
        
        // Animate widgets in immediately after state update
        setTimeout(() => {
          animateWidgetsIn()
        }, 50)
      } else {
        // If no default layout, use hardcoded default
        const layoutToUse = mobile ? DEFAULT_GAME_DETAIL_LAYOUT_MOBILE : DEFAULT_GAME_DETAIL_LAYOUT
        
        if (layoutToUse && Array.isArray(layoutToUse) && layoutToUse.length > 0) {
          // Use exact positions from hardcoded default layout - don't constrain
          const restoredWidgets = layoutToUse.map(widget => {
            try {
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
              } else if (widget.id === 'game-development-info' || widget.type === 'game-development-info') {
                component = () => <GameDevelopmentInfoWidget game={game} />
              }
              
              if (!component) {
                console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
                return null
              }
              
              // Use EXACT saved sizes and positions from default layout - don't constrain or modify
              return {
                ...widget,
                x: widget.x,
                y: widget.y,
                width: widget.width,
                height: widget.height,
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
            
            restoredWidgets.unshift({
              id: 'back-button',
              type: 'back-button',
              x: backButtonX,
              y: backButtonY,
              width: backButtonWidth,
              height: backButtonHeight,
              component: () => <BackButtonWidget onBack={onBack} />,
              locked: true,
              pinned: false
            })
          } else {
            const backButton = restoredWidgets.find(w => w.id === 'back-button')
            if (backButton) {
              backButton.locked = true
              backButton.component = () => <BackButtonWidget onBack={onBack} />
            }
          }
          
          // Use flushSync to ensure the state update happens synchronously
          flushSync(() => {
            setWidgets(restoredWidgets)
          })
          
          // Animate widgets in immediately after state update
          setTimeout(() => {
            animateWidgetsIn()
          }, 50)
        }
      }
      }, 100) // Small delay to ensure viewport has updated
    } else {
      previousMobileStateRef.current = currentMobile
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileState, game, animateWidgetsIn])

  // Initial animation on mount or when widgets are first set
  useEffect(() => {
    if (isInitialMountRef.current && widgets.length > 0 && initializedRef.current) {
      isInitialMountRef.current = false
      previousWidgetsLengthRef.current = widgets.length
      previousWidgetIdsRef.current = widgets.map(w => w.id)
      setTimeout(() => {
        animateInitial()
      }, 100)
    } else if (widgets.length > 0 && initializedRef.current && !isInitialMountRef.current) {
      // Only animate if widgets were actually added/removed (length or IDs changed)
      // Don't animate on position/component updates
      const currentWidgetIds = widgets.map(w => w.id).sort()
      const previousWidgetIds = previousWidgetIdsRef.current.sort()
      const lengthChanged = widgets.length !== previousWidgetsLengthRef.current
      const idsChanged = JSON.stringify(currentWidgetIds) !== JSON.stringify(previousWidgetIds)
      
      if (lengthChanged || idsChanged) {
        // Widgets were added or removed, animate them in
        previousWidgetsLengthRef.current = widgets.length
        previousWidgetIdsRef.current = widgets.map(w => w.id)
        setTimeout(() => {
          animateWidgetsIn()
        }, 50)
      } else {
        // Just update the refs without animating
        previousWidgetsLengthRef.current = widgets.length
        previousWidgetIdsRef.current = widgets.map(w => w.id)
      }
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

  // Add widget at position
  const addWidget = useCallback((widgetType, x, y) => {
    const Component = gameDetailComponentMap[widgetType]
    if (!Component) {
      console.warn(`Widget type ${widgetType} not found`)
      return
    }

    setWidgets(prev => {
      // Check if widget already exists (except back-button which can't be added manually)
      if (widgetType !== 'back-button') {
        const existingWidget = prev.find(w => (w.type === widgetType || w.id === widgetType))
        if (existingWidget) {
          console.warn(`Widget ${widgetType} already exists`)
          return prev
        }
      }

      // Get minimum size for widget
      const minSize = getWidgetMinSize(widgetType)
      const width = snapSizeToGrid(minSize.width)
      const height = snapSizeToGrid(minSize.height)

      // Snap position to grid
      const snappedX = snapToGrid(x, GRID_OFFSET_X)
      const snappedY = snapToGrid(y, GRID_OFFSET_Y)

      // Constrain to viewport
      const constrainedPos = constrainToViewport(snappedX, snappedY, width, height, { x: 0, y: 0 }, false)
      const constrainedSize = constrainSizeToViewport(constrainedPos.x, constrainedPos.y, width, height, minSize.width, minSize.height, { x: 0, y: 0 })

      // Create component function
      let component = null
      if (widgetType === 'back-button') {
        component = () => <BackButtonWidget onBack={onBack} />
      } else if (widgetType === 'game-info') {
        component = () => <GameInfoWidget game={game} />
      } else if (widgetType === 'game-description') {
        component = () => <GameDescriptionWidget game={game} />
      } else if (widgetType === 'game-image') {
        component = () => <GameImageWidget game={game} />
      } else if (widgetType === 'game-details') {
        component = () => <GameDetailsWidget game={game} />
      } else if (widgetType === 'game-development-info') {
        component = () => <GameDevelopmentInfoWidget game={game} />
      }

      if (!component) {
        console.warn(`Component not found for widget type: ${widgetType}`)
        return prev
      }

      const newWidget = {
        id: widgetType,
        type: widgetType,
        x: constrainedPos.x,
        y: constrainedPos.y,
        width: constrainedSize.width,
        height: constrainedSize.height,
        component: component,
        locked: widgetType === 'back-button',
        pinned: false
      }

      return [...prev, newWidget]
    })
    
    closeContextMenu()
  }, [setWidgets, closeContextMenu, game, onBack])

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
    const mobile = isMobile()
    const cookieName = mobile ? COOKIE_NAME_DEFAULT_GAME_DETAIL_MOBILE : COOKIE_NAME_DEFAULT_GAME_DETAIL
    setCookie(cookieName, layoutToSave)
    showToast(`Current layout saved as ${mobile ? 'mobile ' : ''}default!`)
  }, [widgets, showToast])

  // Revert to default layout
  const revertToDefault = useCallback(() => {
    // Try to load default layout from cookie (mobile or desktop)
    const mobile = isMobile()
    const defaultCookieName = mobile ? COOKIE_NAME_DEFAULT_GAME_DETAIL_MOBILE : COOKIE_NAME_DEFAULT_GAME_DETAIL
    const defaultLayout = getCookie(defaultCookieName)
    if (defaultLayout && Array.isArray(defaultLayout) && defaultLayout.length > 0) {
      // Restore from default layout - use exact positions without constraining
      const restoredWidgets = defaultLayout.map(widget => {
        try {
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
          } else if (widget.id === 'game-development-info' || widget.type === 'game-development-info') {
            component = () => <GameDevelopmentInfoWidget game={game} />
          }
          
          if (!component) {
            console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
            return null
          }
          
          // Use EXACT saved sizes and positions from default layout - don't constrain or modify
          return {
            ...widget,
            x: widget.x,
            y: widget.y,
            width: widget.width,
            height: widget.height,
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
        const constrainedBackButton = constrainToViewport(backButtonX, backButtonY, backButtonWidth, backButtonHeight, { x: 0, y: 0 }, false)
        
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
        const backButton = restoredWidgets.find(w => w.id === 'back-button')
        if (backButton) {
          backButton.locked = true
          backButton.component = () => <BackButtonWidget onBack={onBack} />
        }
      }
      
      // Use flushSync to ensure the state update happens synchronously
      flushSync(() => {
        setWidgets(restoredWidgets)
      })
      
      // Animate widgets in immediately after state update
      setTimeout(() => {
        animateWidgetsIn()
      }, 50)
      
      showToast('Layout reverted to default!')
      return
    }
    
    // If no default layout, use hardcoded default
    const backButtonWidth = snapSizeToGrid(120)
    const backButtonHeight = snapSizeToGrid(60)
    const backButtonX = snapToGrid(GRID_OFFSET_X, GRID_OFFSET_X)
    const backButtonY = snapToGrid(GRID_OFFSET_Y, GRID_OFFSET_Y)
    const constrainedBackButton = constrainToViewport(backButtonX, backButtonY, backButtonWidth, backButtonHeight, { x: 0, y: 0 }, false)

    const gameInfoX = snapToGrid(constrainedBackButton.x + backButtonWidth + GRID_SIZE, GRID_OFFSET_X)
    const gameInfoY = snapToGrid(GRID_OFFSET_Y, GRID_OFFSET_Y)
    const gameInfoWidth = snapSizeToGrid(250)
    const gameInfoHeight = snapSizeToGrid(180)
    const constrainedGameInfo = constrainToViewport(gameInfoX, gameInfoY, gameInfoWidth, gameInfoHeight, { x: 0, y: 0 }, false)

    const gameDescriptionX = snapToGrid(constrainedGameInfo.x + gameInfoWidth + GRID_SIZE, GRID_OFFSET_X)
    const gameDescriptionY = snapToGrid(GRID_OFFSET_Y, GRID_OFFSET_Y)
    const gameDescriptionWidth = snapSizeToGrid(300)
    const gameDescriptionHeight = snapSizeToGrid(250)
    const constrainedGameDescription = constrainToViewport(gameDescriptionX, gameDescriptionY, gameDescriptionWidth, gameDescriptionHeight, { x: 0, y: 0 }, false)

    const gameImageX = snapToGrid(GRID_OFFSET_X, GRID_OFFSET_X)
    const gameImageY = snapToGrid(constrainedBackButton.y + backButtonHeight + GRID_SIZE, GRID_OFFSET_Y)
    const gameImageWidth = snapSizeToGrid(400)
    const gameImageHeight = snapSizeToGrid(300)
    const constrainedGameImage = constrainToViewport(gameImageX, gameImageY, gameImageWidth, gameImageHeight, { x: 0, y: 0 }, false)

    const gameDetailsX = snapToGrid(constrainedGameImage.x + gameImageWidth + GRID_SIZE, GRID_OFFSET_X)
    const gameDetailsY = snapToGrid(constrainedGameImage.y, GRID_OFFSET_Y)
    const gameDetailsWidth = snapSizeToGrid(200)
    const gameDetailsHeight = snapSizeToGrid(200)
    const constrainedGameDetails = constrainToViewport(gameDetailsX, gameDetailsY, gameDetailsWidth, gameDetailsHeight, { x: 0, y: 0 }, false)

    const gameDevelopmentInfoX = snapToGrid(constrainedGameImage.x, GRID_OFFSET_X)
    const gameDevelopmentInfoY = snapToGrid(constrainedGameImage.y + gameImageHeight + GRID_SIZE, GRID_OFFSET_Y)
    const gameDevelopmentInfoWidth = snapSizeToGrid(400)
    const gameDevelopmentInfoHeight = snapSizeToGrid(300)
    const constrainedGameDevelopmentInfo = constrainToViewport(gameDevelopmentInfoX, gameDevelopmentInfoY, gameDevelopmentInfoWidth, gameDevelopmentInfoHeight, { x: 0, y: 0 }, false)

    const defaultWidgets = [
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
      },
      {
        id: 'game-development-info',
        type: 'game-development-info',
        x: constrainedGameDevelopmentInfo.x,
        y: constrainedGameDevelopmentInfo.y,
        width: gameDevelopmentInfoWidth,
        height: gameDevelopmentInfoHeight,
        component: () => <GameDevelopmentInfoWidget game={game} />,
        locked: false,
        pinned: false
      }
    ]

    // Use flushSync to ensure the state update happens synchronously
    flushSync(() => {
      setWidgets(defaultWidgets)
    })
    
    // Animate widgets in immediately after state update
    setTimeout(() => {
      animateWidgetsIn()
    }, 50)
    
    showToast('Layout reverted to default!')
  }, [setWidgets, showToast, game, onBack, animateWidgetsIn, centerOffset])

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

  const mobile = isMobile()
  
  return (
    <div 
      style={{
        width: '100vw',
        height: mobile ? 'auto' : '100vh',
        minHeight: mobile ? '100vh' : 'auto',
        overflow: mobile ? 'auto' : 'hidden',
        overflowX: 'hidden', // Prevent horizontal scrolling on all devices
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
        componentMap={gameDetailComponentMap}
      />
      
      <GridBackground centerOffset={centerOffset} />
      
      <GridMask widgets={widgets} centerOffset={centerOffset} isDragging={isDragging} isResizing={isResizing} dragStateRef={dragStateRef} />
      
      <WidgetContainer
        widgets={validWidgets}
        isDragging={isDragging}
        isResizing={isResizing}
        collisionWidgetId={collisionWidgetId}
        dragStateRef={dragStateRef}
        resizeStateRef={resizeStateRef}
        onMouseDown={handleMouseDownWithContext}
        centerOffset={centerOffset}
      />
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

