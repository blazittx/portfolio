import { useEffect, useCallback, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
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
import { getWidgetMinSize, COOKIE_NAME_DEFAULT, COOKIE_NAME_DEFAULT_GAME_DETAIL, GRID_SIZE, USABLE_GRID_HEIGHT, USABLE_GRID_WIDTH, WIDGET_PADDING } from './constants/grid'
import { snapToGrid, snapSizeToGrid, constrainToViewport, constrainSizeToViewport, calculateCenterOffset } from './utils/grid'
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
  
  // Calculate center offset to center the layout horizontally and vertically
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [showDebugOutline, setShowDebugOutline] = useState(false)
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Toggle debug outline with F3 key
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F3 key
      if (e.key === 'F2') {
        e.preventDefault()
        setShowDebugOutline(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  const centerOffset = useMemo(() => {
    if (currentView !== 'main') {
      return { x: 0, y: 0 }
    }
    return calculateCenterOffset()
  }, [currentView, windowSize])
  const {
    isDragging,
    isResizing,
    collisionWidgetId,
    swapTargetId,
    dragStateRef,
    resizeStateRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    wasLastInteractionDrag
  } = useDragAndResize(widgets, setWidgets, centerOffset)
  
  const autosortWidgets = useAutosort(widgets, setWidgets, centerOffset)
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

  // Update widget settings
  const updateWidgetSettings = useCallback((widgetId, newSettings) => {
    setWidgets(prev => prev.map(w => {
      if (w.id === widgetId) {
        return { ...w, settings: { ...(w.settings || {}), ...newSettings } }
      }
      return w
    }))
  }, [setWidgets])

  // Expand/collapse profile picture widget
  const toggleProfilePictureExpand = useCallback((widgetId) => {
    setWidgets(prev => {
      const profilePicWidget = prev.find(w => w.id === widgetId && w.type === 'profile-picture')
      if (!profilePicWidget) return prev

      const isExpanded = profilePicWidget.settings?.expanded || false
      const EXPAND_SCALE = 2

      if (!isExpanded) {
        // EXPAND
        const { width: originalWidth, height: originalHeight, x: originalX, y: originalY } = profilePicWidget
        
        let expandedWidth = snapSizeToGrid(originalWidth * EXPAND_SCALE)
        let expandedHeight = snapSizeToGrid(originalHeight * EXPAND_SCALE)
        let expandedX = originalX - (expandedWidth - originalWidth) / 2
        let expandedY = originalY - (expandedHeight - originalHeight) / 2

        const sizeConstrained = constrainSizeToViewport(expandedX, expandedY, expandedWidth, expandedHeight, getWidgetMinSize('profile-picture').width, getWidgetMinSize('profile-picture').height)
        expandedWidth = sizeConstrained.width
        expandedHeight = sizeConstrained.height
        
        const constrained = constrainToViewport(expandedX, expandedY, expandedWidth, expandedHeight, { x: 0, y: 0 }, true)
        const expandedRect = { x: constrained.x, y: constrained.y, width: expandedWidth, height: expandedHeight }

        return prev.map(w => {
          if (w.id === widgetId) {
            return {
              ...w,
              ...expandedRect,
              settings: { ...(w.settings || {}), expanded: true, originalWidth, originalHeight, originalX, originalY }
            }
          }

          const widgetRect = { x: w.x, y: w.y, width: w.width, height: w.height }
          const collides = !(widgetRect.x + widgetRect.width <= expandedRect.x || expandedRect.x + expandedRect.width <= widgetRect.x ||
                            widgetRect.y + widgetRect.height <= expandedRect.y || expandedRect.y + expandedRect.height <= widgetRect.y)
          if (!collides) return w

          // Determine adjustment direction
          const widgetRight = widgetRect.x + widgetRect.width
          const widgetBottom = widgetRect.y + widgetRect.height
          const expandedRight = expandedRect.x + expandedRect.width
          const expandedBottom = expandedRect.y + expandedRect.height
          const overlapsH = widgetRect.x < expandedRight && widgetRight > expandedRect.x
          const overlapsV = widgetRect.y < expandedBottom && widgetBottom > expandedRect.y
          const widgetCenterY = widgetRect.y + widgetRect.height / 2
          const profileCenterY = expandedRect.y + expandedRect.height / 2
          const isBelow = overlapsH && (widgetRect.y >= expandedBottom - GRID_SIZE || widgetCenterY > profileCenterY)
          const isToLeft = overlapsV && widgetRight > expandedRect.x && widgetRect.x < expandedRect.x && !isBelow
          const isToRight = overlapsV && widgetRect.x < expandedRight && widgetRight > expandedRight && !isBelow

          const { width: origW, height: origH, x: origX, y: origY } = w
          let newX = origX, newY = origY, newWidth = origW, newHeight = origH

          if (isBelow) {
            const overlapTop = Math.max(0, expandedBottom - widgetRect.y)
            const minH = getWidgetMinSize(w.type).height
            const heightReduction = overlapTop > 0 ? overlapTop + GRID_SIZE : 
              (widgetRect.y - expandedBottom < GRID_SIZE ? GRID_SIZE - (widgetRect.y - expandedBottom) + origH * 0.1 : origH * 0.15)
            newHeight = Math.max(minH, snapSizeToGrid(origH - heightReduction))
            newY = snapToGrid(origY + (origH - newHeight), GRID_OFFSET_Y)
            const maxY = GRID_OFFSET_Y + (USABLE_GRID_HEIGHT * GRID_SIZE) - WIDGET_PADDING - newHeight
            if (newY + newHeight > GRID_OFFSET_Y + (USABLE_GRID_HEIGHT * GRID_SIZE) - WIDGET_PADDING) {
              newY = Math.max(GRID_OFFSET_Y + WIDGET_PADDING, maxY)
              if (newY + newHeight > GRID_OFFSET_Y + (USABLE_GRID_HEIGHT * GRID_SIZE) - WIDGET_PADDING) {
                newHeight = Math.max(minH, snapSizeToGrid((GRID_OFFSET_Y + (USABLE_GRID_HEIGHT * GRID_SIZE) - WIDGET_PADDING) - newY))
              }
            }
          }

          if (isToLeft) {
            const minW = getWidgetMinSize(w.type).width
            const overlap = widgetRight - expandedRect.x
            const widthReduction = widgetRect.x >= expandedRect.x ? GRID_SIZE + origW * 0.1 : overlap + GRID_SIZE
            newWidth = Math.max(minW, snapSizeToGrid(origW - widthReduction))
            newX = origX
            const minX = GRID_OFFSET_X + WIDGET_PADDING
            if (newX < minX) {
              newX = minX
              newWidth = Math.max(minW, snapSizeToGrid(origX + origW - minX - GRID_SIZE))
            }
            newX = snapToGrid(newX, GRID_OFFSET_X)
          }

          if (isToRight) {
            const minW = getWidgetMinSize(w.type).width
            const overlap = expandedRight - widgetRect.x
            const widthReduction = widgetRight <= expandedRight ? GRID_SIZE + origW * 0.1 : overlap + GRID_SIZE
            newWidth = Math.max(minW, snapSizeToGrid(origW - widthReduction))
            newX = snapToGrid(origX + (origW - newWidth), GRID_OFFSET_X)
            const maxX = GRID_OFFSET_X + (USABLE_GRID_WIDTH * GRID_SIZE) - WIDGET_PADDING - newWidth
            if (newX + newWidth > GRID_OFFSET_X + (USABLE_GRID_WIDTH * GRID_SIZE) - WIDGET_PADDING) {
              newX = Math.min(GRID_OFFSET_X + (USABLE_GRID_WIDTH * GRID_SIZE) - WIDGET_PADDING - newWidth, maxX)
              if (newX + newWidth > GRID_OFFSET_X + (USABLE_GRID_WIDTH * GRID_SIZE) - WIDGET_PADDING) {
                newWidth = Math.max(minW, snapSizeToGrid((GRID_OFFSET_X + (USABLE_GRID_WIDTH * GRID_SIZE) - WIDGET_PADDING) - newX))
              }
            }
          }

          const finalSize = constrainSizeToViewport(newX, newY, newWidth, newHeight, getWidgetMinSize(w.type).width, getWidgetMinSize(w.type).height)
          const finalPos = constrainToViewport(newX, newY, finalSize.width, finalSize.height, { x: 0, y: 0 }, true)

          return {
            ...w,
            x: finalPos.x,
            y: finalPos.y,
            width: finalSize.width,
            height: finalSize.height,
            settings: { ...(w.settings || {}), originalWidth: origW, originalHeight: origH, originalX: origX, originalY: origY, adjusted: true }
          }
        })
      } else {
        // COLLAPSE
        const { originalWidth, originalHeight, originalX, originalY } = profilePicWidget.settings || {}
        const restore = { x: originalX || profilePicWidget.x, y: originalY || profilePicWidget.y, width: originalWidth || profilePicWidget.width, height: originalHeight || profilePicWidget.height }

        return prev.map(w => {
          if (w.id === widgetId) {
            return { ...w, ...restore, settings: { ...(w.settings || {}), expanded: false } }
          }
          if (w.settings?.adjusted) {
            const { originalWidth: rW, originalHeight: rH, originalX: rX, originalY: rY, ...rest } = w.settings
            return {
              ...w,
              x: rX || w.x,
              y: rY || w.y,
              width: rW || w.width,
              height: rH || w.height,
              settings: Object.keys(rest).length > 0 ? rest : undefined
            }
          }
          return w
        })
      }
    })
  }, [setWidgets])

  // Set current layout as default
  const setAsDefault = useCallback(() => {
    const layoutToSave = widgets.map(({ id, type, x, y, width, height, locked, pinned, settings }) => ({
      id,
      type,
      x,
      y,
      width,
      height,
      locked: locked || false,
      pinned: pinned || false,
      settings: settings || {}
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
            // Don't enforce usable area bounds when loading saved layouts - just ensure visibility
            const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height, { x: 0, y: 0 }, false)
            
            // Always use widget.type to look up component (not widget.id, which may have suffixes like -1, -2)
            const component = componentMap[widget.type]
            
            if (!component) {
              console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
              return null
            }
            
            // Initialize default settings for widgets that need them
            let settings = widget.settings || {}
            if (widget.type === 'single-game' && (!settings.gameId || !['pullbackracers', 'bubbledome', 'gamblelite', 'gp1', 'Forgekeepers', 'GFOS1992'].includes(settings.gameId))) {
              settings = { gameId: 'pullbackracers' }
            }
            
            // Preserve EXACT saved sizes and positions - don't modify them at all
            // Only ensure they're valid numbers
            const finalWidth = typeof widget.width === 'number' && widget.width > 0 ? widget.width : getWidgetMinSize(widget.type).width
            const finalHeight = typeof widget.height === 'number' && widget.height > 0 ? widget.height : getWidgetMinSize(widget.type).height
            
            return {
              ...widget,
              x: constrainedPos.x,
              y: constrainedPos.y,
              width: finalWidth,
              height: finalHeight,
              component: component,
              locked: widget.locked || false,
              pinned: widget.pinned || false,
              settings: settings
            }
          } catch (error) {
            console.error(`Error restoring widget ${widget.id}:`, error)
            return null
          }
        })
        .filter(widget => widget !== null)
      
      // Don't auto-add widgets - respect what the user has saved
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
  }, [setWidgets, showToast, centerOffset])

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
        // For widgets that allow multiple instances (like single-game), generate unique IDs
        // For other widgets, check if they already exist
        const allowsMultipleInstances = widgetType === 'single-game'
        
        if (!allowsMultipleInstances) {
          const existingWidget = prev.find(w => (w.type === widgetType || w.id === widgetType))
          if (existingWidget) {
            console.warn(`Widget ${widgetType} already exists`)
            return prev
          }
        }

        // Generate unique ID for widgets that allow multiple instances
        let widgetId = widgetType
        if (allowsMultipleInstances) {
          // Find the highest number used for this widget type
          const existingWidgets = prev.filter(w => w.type === widgetType)
          let maxNumber = 0
          existingWidgets.forEach(w => {
            const match = w.id.match(new RegExp(`^${widgetType}-(\\d+)$`))
            if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNumber) {
                maxNumber = num
              }
            }
          })
          widgetId = `${widgetType}-${maxNumber + 1}`
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
        const constrained = constrainToViewport(snappedX, snappedY, width, height, centerOffset)

        // Find nearest valid position that doesn't collide with existing widgets
        const validPosition = findNearestValidPosition(
          constrained.x,
          constrained.y,
          width,
          height,
          prev,
          null // No widget to exclude
        )

        // Initialize settings based on widget type
        let settings = {}
        if (widgetType === 'single-game') {
          settings = { gameId: 'pullbackracers' } // Default to first game
        }

        // Create new widget - ensure all properties are set and create a new object
        const newWidget = {
          id: widgetId,
          type: widgetType,
          x: validPosition.x,
          y: validPosition.y,
          width: width,
          height: height,
          component: Component,
          locked: false,
          pinned: false,
          settings: settings
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
  }, [setWidgets, closeContextMenu, animateWidgetsIn, centerOffset])

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
        {"id":"profile","type":"profile","x":28.2,"y":26.4,"width":246,"height":111,"locked":false,"pinned":true,"settings":{}},
        {"id":"about","type":"about","x":298.2,"y":26.4,"width":291,"height":111,"locked":false,"pinned":true,"settings":{}},
        {"id":"contact","type":"contact","x":613.2,"y":26.4,"width":246,"height":111,"locked":false,"pinned":true,"settings":{}},
        {"id":"visitors","type":"visitors","x":883.2,"y":26.4,"width":111,"height":111,"locked":false,"pinned":true,"settings":{}},
        {"id":"single-game","type":"single-game","x":1018.2,"y":431.4,"width":516,"height":426,"locked":false,"pinned":false,"settings":{"gameId":"pullbackracers"}},
        {"id":"single-game-3","type":"single-game","x":1018.2,"y":26.4,"width":516,"height":381,"locked":false,"pinned":false,"settings":{"gameId":"gamblelite"}},
        {"id":"github","type":"github","x":28.2,"y":161.39999999999998,"width":381,"height":696,"locked":false,"pinned":false,"settings":{}},
        {"id":"games","type":"games","x":433.2,"y":161.4,"width":561,"height":561,"locked":false,"pinned":false,"settings":{}},
        {"id":"apikey","type":"apikey","x":433.2,"y":746.4,"width":291,"height":111,"locked":false,"pinned":false,"settings":{}},
        {"id":"time","type":"time","x":748.2,"y":746.4,"width":246,"height":111,"locked":false,"pinned":false,"settings":{}}
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
      
      <GridBackground centerOffset={centerOffset} showDebugOutline={showDebugOutline} />
      
      <GridMask widgets={widgets} centerOffset={centerOffset} isDragging={isDragging} isResizing={isResizing} dragStateRef={dragStateRef} />
      
      <WidgetContainer
        widgets={validWidgets}
        isDragging={isDragging}
        isResizing={isResizing}
        collisionWidgetId={collisionWidgetId}
        swapTargetId={swapTargetId}
        dragStateRef={dragStateRef}
        resizeStateRef={resizeStateRef}
        onMouseDown={handleMouseDownWithContext}
        wasLastInteractionDrag={wasLastInteractionDrag}
        onGameClick={navigateToGameDetail}
        centerOffset={centerOffset}
        onUpdateWidgetSettings={updateWidgetSettings}
        onToggleProfilePictureExpand={toggleProfilePictureExpand}
      />
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
