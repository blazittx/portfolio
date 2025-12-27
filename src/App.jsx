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
import CVDetailView from './components/CVDetailView'
import Toaster from './components/Toaster'
import { getWidgetMinSize, COOKIE_NAME_DEFAULT, COOKIE_NAME_DEFAULT_GAME_DETAIL, COOKIE_NAME_DEFAULT_MOBILE, GRID_SIZE, WIDGET_PADDING } from './constants/grid'
import { GAME_IDS } from './constants/games'
import { getUsableGridWidth, getUsableGridHeight } from './utils/grid'
import { snapToGrid, snapSizeToGrid, constrainToViewport, constrainSizeToViewport, calculateCenterOffset } from './utils/grid'
import { findNearestValidPosition } from './utils/collision'
import { GRID_OFFSET_X, GRID_OFFSET_Y } from './constants/grid'
import { setCookie, getCookie } from './utils/cookies'
import { DEFAULT_HOMEPAGE_LAYOUT, DEFAULT_GAME_DETAIL_LAYOUT, DEFAULT_HOMEPAGE_LAYOUT_MOBILE } from './utils/setDefaultLayouts'
import { isMobile } from './utils/mobile'
import ProfileWidget from './components/ProfileWidget'
import AboutWidget from './components/AboutWidget'
import SkillsWidget from './components/SkillsWidget'
import ContactWidget from './components/ContactWidget'
import GamesWidget from './components/GamesWidget'

function App() {
  const { currentView, selectedGame, navigateToGameDetail: originalNavigateToGameDetail, navigateToMain: originalNavigateToMain, navigateToCV: originalNavigateToCV, isLoading } = useView()
  const [widgets, setWidgets] = useWidgets('main')
  const { transition, animateInitial, animateWidgetsIn } = usePageTransition()
  const previousViewRef = useRef(currentView)
  const isInitialMountRef = useRef(true)
  
  // Ensure widgets is always an array
  const validWidgets = useMemo(() => Array.isArray(widgets) ? widgets : [], [widgets])
  
  // Calculate center offset to center the layout horizontally and vertically
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [showDebugOutline, setShowDebugOutline] = useState(false)
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
  
  // Switch layouts when mobile state changes - calls revertToDefault logic directly
  useEffect(() => {
    const previousMobile = previousMobileStateRef.current
    const currentMobile = isMobileState
    
    // Only reload if mobile state actually changed
    if (previousMobile !== currentMobile && currentView === 'main') {
      previousMobileStateRef.current = currentMobile
      
      // Small delay to ensure viewport has updated after resize
      setTimeout(() => {
        // Directly call the revertToDefault logic to ensure it works correctly
        // This ensures widgets are properly restored without getting mushed together
        const mobile = isMobile() // Re-check mobile state after delay
        const defaultCookieName = mobile ? COOKIE_NAME_DEFAULT_MOBILE : COOKIE_NAME_DEFAULT
        const defaultLayout = getCookie(defaultCookieName)
        
        if (defaultLayout && Array.isArray(defaultLayout) && defaultLayout.length > 0) {
          // Restore from default layout - use exact positions without constraining
          // Default layouts are already positioned correctly for their screen size
          const restoredWidgets = defaultLayout
            .map(widget => {
              try {
                // Always use widget.type to look up component (not widget.id, which may have suffixes like -1, -2)
                const component = componentMap[widget.type]
                
                if (!component) {
                  console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
                  return null
                }
                
                // Initialize default settings for widgets that need them
                let settings = widget.settings || {}
                if (widget.type === 'single-game' && (!settings.gameId || !GAME_IDS.includes(settings.gameId))) {
                  settings = { gameId: GAME_IDS[0] }
                }
                // Initialize expandable settings
                if (widget.type === 'profile-picture' && !settings.expandable) {
                  settings = { ...settings, expandable: true, expandScaleX: 2, expandScaleY: 2 }
                }
                
                // Use EXACT saved sizes and positions from default layout - don't constrain or modify
                const finalWidth = typeof widget.width === 'number' && widget.width > 0 ? widget.width : getWidgetMinSize(widget.type).width
                const finalHeight = typeof widget.height === 'number' && widget.height > 0 ? widget.height : getWidgetMinSize(widget.type).height
                
                return {
                  ...widget,
                  x: widget.x,
                  y: widget.y,
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
          
          // Use flushSync to ensure the state update happens synchronously
          flushSync(() => {
            setWidgets(restoredWidgets)
          })
          
          // Animate widgets in immediately after state update
          setTimeout(() => {
            animateWidgetsIn()
          }, 50)
        } else {
          // If no default layout cookie, use hardcoded default for the current screen size
          const layoutToUse = mobile ? DEFAULT_HOMEPAGE_LAYOUT_MOBILE : DEFAULT_HOMEPAGE_LAYOUT
          
          if (layoutToUse && Array.isArray(layoutToUse) && layoutToUse.length > 0) {
            // Use exact positions from hardcoded default layout - don't constrain
            const restoredWidgets = layoutToUse
              .map(widget => {
                try {
                  // Always use widget.type to look up component
                  const component = componentMap[widget.type]
                  
                  if (!component) {
                    console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
                    return null
                  }
                  
                  // Initialize default settings for widgets that need them
                  let settings = widget.settings || {}
                  if (widget.type === 'single-game' && (!settings.gameId || !GAME_IDS.includes(settings.gameId))) {
                    settings = { gameId: GAME_IDS[0] }
                  }
                  // Initialize expandable settings
                  if (widget.type === 'profile-picture' && !settings.expandable) {
                    settings = { ...settings, expandable: true, expandScaleX: 2, expandScaleY: 2 }
                  }
                  
                  // Use EXACT saved sizes and positions from default layout - don't constrain or modify
                  const finalWidth = typeof widget.width === 'number' && widget.width > 0 ? widget.width : getWidgetMinSize(widget.type).width
                  const finalHeight = typeof widget.height === 'number' && widget.height > 0 ? widget.height : getWidgetMinSize(widget.type).height
                  
                  return {
                    ...widget,
                    x: widget.x,
                    y: widget.y,
                    width: finalWidth,
                    height: finalHeight,
                    component: component,
                    locked: widget.locked || false,
                    pinned: widget.pinned || false,
                    settings: settings
                  }
                } catch (error) {
                  console.error(`Error creating widget ${widget.id}:`, error)
                  return null
                }
              })
              .filter(widget => widget !== null)
            
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
  }, [isMobileState, currentView, animateWidgetsIn])
  
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

  // Generalized expand/collapse widget function
  // Widgets can enable this by setting settings.expandable = true
  // Configure scale with settings.expandScaleX and settings.expandScaleY (default: 2 for both)
  const toggleWidgetExpand = useCallback((widgetId) => {
    setWidgets(prev => {
      const widget = prev.find(w => w.id === widgetId)
      if (!widget || !widget.settings?.expandable) return prev

      const isExpanded = widget.settings?.expanded || false
      const scaleX = widget.settings?.expandScaleX ?? 2
      const scaleY = widget.settings?.expandScaleY ?? 2

      if (!isExpanded) {
        // EXPAND
        const { width: originalWidth, height: originalHeight, x: originalX, y: originalY } = widget
        
        let expandedWidth = snapSizeToGrid(originalWidth * scaleX)
        let expandedHeight = snapSizeToGrid(originalHeight * scaleY)
        let expandedX = originalX - (expandedWidth - originalWidth) / 2
        let expandedY = originalY - (expandedHeight - originalHeight) / 2

        const sizeConstrained = constrainSizeToViewport(expandedX, expandedY, expandedWidth, expandedHeight, getWidgetMinSize(widget.type).width, getWidgetMinSize(widget.type).height)
        expandedWidth = sizeConstrained.width
        expandedHeight = sizeConstrained.height
        
        const constrained = constrainToViewport(expandedX, expandedY, expandedWidth, expandedHeight, { x: 0, y: 0 }, true)
        const expandedRect = { x: constrained.x, y: constrained.y, width: expandedWidth, height: expandedHeight }

        // If expanding profile-picture, calculate profile widget expansion
        let profileExpandedRect = null
        if (widget.type === 'profile-picture') {
          const profileWidget = prev.find(pw => pw.type === 'profile' && pw.id !== widgetId)
          if (profileWidget && !profileWidget.settings?.expanded) {
            const { width: profOrigW, height: profOrigH, x: profOrigX, y: profOrigY } = profileWidget
            let profExpandedHeight = snapSizeToGrid(profOrigH * 2)
            let profExpandedY = profOrigY - (profExpandedHeight - profOrigH) / 2
            
            const profSizeConstrained = constrainSizeToViewport(profOrigX, profExpandedY, profOrigW, profExpandedHeight, getWidgetMinSize('profile').width, getWidgetMinSize('profile').height)
            profExpandedHeight = profSizeConstrained.height
            
            const profConstrained = constrainToViewport(profOrigX, profExpandedY, profOrigW, profExpandedHeight, { x: 0, y: 0 }, true)
            profileExpandedRect = { x: profConstrained.x, y: profConstrained.y, width: profOrigW, height: profExpandedHeight }
          }
        }

        return prev.map(w => {
          if (w.id === widgetId) {
            return {
              ...w,
              ...expandedRect,
              settings: { ...(w.settings || {}), expanded: true, originalWidth, originalHeight, originalX, originalY }
            }
          }

          const widgetRect = { x: w.x, y: w.y, width: w.width, height: w.height }
          // Check collision with expanded profile picture
          const collidesWithPic = !(widgetRect.x + widgetRect.width <= expandedRect.x || expandedRect.x + expandedRect.width <= widgetRect.x ||
                                   widgetRect.y + widgetRect.height <= expandedRect.y || expandedRect.y + expandedRect.height <= widgetRect.y)
          // Check collision with expanded profile widget (if it exists)
          const collidesWithProfile = profileExpandedRect && !(widgetRect.x + widgetRect.width <= profileExpandedRect.x || profileExpandedRect.x + profileExpandedRect.width <= widgetRect.x ||
                                                              widgetRect.y + widgetRect.height <= profileExpandedRect.y || profileExpandedRect.y + profileExpandedRect.height <= widgetRect.y)
          
          // Special handling for profile widget when profile-picture expands
          if (widget.type === 'profile-picture' && w.type === 'profile' && !w.settings?.expanded) {
            const { width: profOrigW, height: profOrigH, x: profOrigX, y: profOrigY } = w
            let adjustedX = profOrigX
            let adjustedY = profOrigY
            let adjustedWidth = profOrigW
            let adjustedHeight = profOrigH
            
            // First, adjust if colliding with expanded profile picture
            if (collidesWithPic) {
              const widgetRight = widgetRect.x + widgetRect.width
              const widgetBottom = widgetRect.y + widgetRect.height
              const expandedRight = expandedRect.x + expandedRect.width
              const expandedBottom = expandedRect.y + expandedRect.height
              const overlapsH = widgetRect.x < expandedRight && widgetRight > expandedRect.x
              const overlapsV = widgetRect.y < expandedBottom && widgetBottom > expandedRect.y
              const widgetCenterY = widgetRect.y + widgetRect.height / 2
              const expandedCenterY = expandedRect.y + expandedRect.height / 2
              const isBelow = overlapsH && (widgetRect.y >= expandedBottom - GRID_SIZE || widgetCenterY > expandedCenterY)
              const isToLeft = overlapsV && widgetRight > expandedRect.x && widgetRect.x < expandedRect.x && !isBelow
              const isToRight = overlapsV && widgetRect.x < expandedRight && widgetRight > expandedRight && !isBelow

              if (isBelow) {
                const overlapTop = Math.max(0, expandedBottom - widgetRect.y)
                const minH = getWidgetMinSize(w.type).height
                const heightReduction = overlapTop > 0 ? overlapTop + GRID_SIZE : 
                  (widgetRect.y - expandedBottom < GRID_SIZE ? GRID_SIZE - (widgetRect.y - expandedBottom) + profOrigH * 0.1 : profOrigH * 0.15)
                adjustedHeight = Math.max(minH, snapSizeToGrid(profOrigH - heightReduction))
                adjustedY = snapToGrid(profOrigY + (profOrigH - adjustedHeight), GRID_OFFSET_Y)
                const gridHeight = getUsableGridHeight()
                const maxY = GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING - adjustedHeight
                if (adjustedY + adjustedHeight > GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING) {
                  adjustedY = Math.max(GRID_OFFSET_Y + WIDGET_PADDING, maxY)
                  if (adjustedY + adjustedHeight > GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING) {
                    adjustedHeight = Math.max(minH, snapSizeToGrid((GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING) - adjustedY))
                  }
                }
              }

              if (isToLeft) {
                const minW = getWidgetMinSize(w.type).width
                const overlap = widgetRight - expandedRect.x
                const widthReduction = widgetRect.x >= expandedRect.x ? GRID_SIZE + profOrigW * 0.1 : overlap + GRID_SIZE
                adjustedWidth = Math.max(minW, snapSizeToGrid(profOrigW - widthReduction))
                adjustedX = profOrigX
                const minX = GRID_OFFSET_X + WIDGET_PADDING
                if (adjustedX < minX) {
                  adjustedX = minX
                  adjustedWidth = Math.max(minW, snapSizeToGrid(profOrigX + profOrigW - minX - GRID_SIZE))
                }
                adjustedX = snapToGrid(adjustedX, GRID_OFFSET_X)
              }

              if (isToRight) {
                const minW = getWidgetMinSize(w.type).width
                const overlap = expandedRight - widgetRect.x
                const widthReduction = widgetRight <= expandedRight ? GRID_SIZE + profOrigW * 0.1 : overlap + GRID_SIZE
                adjustedWidth = Math.max(minW, snapSizeToGrid(profOrigW - widthReduction))
                adjustedX = snapToGrid(profOrigX + (profOrigW - adjustedWidth), GRID_OFFSET_X)
                const gridWidth = getUsableGridWidth()
                const maxX = GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING - adjustedWidth
                if (adjustedX + adjustedWidth > GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING) {
                  adjustedX = Math.min(GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING - adjustedWidth, maxX)
                  if (adjustedX + adjustedWidth > GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING) {
                    adjustedWidth = Math.max(minW, snapSizeToGrid((GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING) - adjustedX))
                  }
                }
              }

              const finalSize = constrainSizeToViewport(adjustedX, adjustedY, adjustedWidth, adjustedHeight, getWidgetMinSize(w.type).width, getWidgetMinSize(w.type).height)
              const finalPos = constrainToViewport(adjustedX, adjustedY, finalSize.width, finalSize.height, { x: 0, y: 0 }, true)
              adjustedX = finalPos.x
              adjustedY = finalPos.y
              adjustedWidth = finalSize.width
              adjustedHeight = finalSize.height
            }
            
            // Then expand vertically 2x
            let profExpandedHeight = snapSizeToGrid(adjustedHeight * 2)
            let profExpandedY = adjustedY - (profExpandedHeight - adjustedHeight) / 2
            
            const profSizeConstrained = constrainSizeToViewport(adjustedX, profExpandedY, adjustedWidth, profExpandedHeight, getWidgetMinSize('profile').width, getWidgetMinSize('profile').height)
            profExpandedHeight = profSizeConstrained.height
            
            const profConstrained = constrainToViewport(adjustedX, profExpandedY, adjustedWidth, profExpandedHeight, { x: 0, y: 0 }, true)
            
            return {
              ...w,
              x: profConstrained.x,
              y: profConstrained.y,
              width: adjustedWidth,
              height: profExpandedHeight,
              settings: { ...(w.settings || {}), expanded: true, originalWidth: profOrigW, originalHeight: profOrigH, originalX: profOrigX, originalY: profOrigY, adjusted: collidesWithPic }
            }
          }
          
          if (!collidesWithPic && !collidesWithProfile) return w
          
          // Use the expanded rect that causes collision (prioritize profile picture)
          const collisionRect = collidesWithPic ? expandedRect : (profileExpandedRect || expandedRect)

          // Determine adjustment direction
          const widgetRight = widgetRect.x + widgetRect.width
          const widgetBottom = widgetRect.y + widgetRect.height
          const expandedRight = collisionRect.x + collisionRect.width
          const expandedBottom = collisionRect.y + collisionRect.height
          const overlapsH = widgetRect.x < expandedRight && widgetRight > collisionRect.x
          const overlapsV = widgetRect.y < expandedBottom && widgetBottom > collisionRect.y
          const widgetCenterY = widgetRect.y + widgetRect.height / 2
          const expandedCenterY = collisionRect.y + collisionRect.height / 2
          const isBelow = overlapsH && (widgetRect.y >= expandedBottom - GRID_SIZE || widgetCenterY > expandedCenterY)
          const isToLeft = overlapsV && widgetRight > collisionRect.x && widgetRect.x < collisionRect.x && !isBelow
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
            const gridHeight = getUsableGridHeight()
            const maxY = GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING - newHeight
            if (newY + newHeight > GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING) {
              newY = Math.max(GRID_OFFSET_Y + WIDGET_PADDING, maxY)
              if (newY + newHeight > GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING) {
                newHeight = Math.max(minH, snapSizeToGrid((GRID_OFFSET_Y + (gridHeight * GRID_SIZE) - WIDGET_PADDING) - newY))
              }
            }
          }

          if (isToLeft) {
            const minW = getWidgetMinSize(w.type).width
            const overlap = widgetRight - collisionRect.x
            const widthReduction = widgetRect.x >= collisionRect.x ? GRID_SIZE + origW * 0.1 : overlap + GRID_SIZE
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
            const gridWidth = getUsableGridWidth()
            const maxX = GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING - newWidth
            if (newX + newWidth > GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING) {
              newX = Math.min(GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING - newWidth, maxX)
              if (newX + newWidth > GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING) {
                newWidth = Math.max(minW, snapSizeToGrid((GRID_OFFSET_X + (gridWidth * GRID_SIZE) - WIDGET_PADDING) - newX))
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
        const { originalWidth, originalHeight, originalX, originalY } = widget.settings || {}
        const restore = { x: originalX || widget.x, y: originalY || widget.y, width: originalWidth || widget.width, height: originalHeight || widget.height }

        return prev.map(w => {
          if (w.id === widgetId) {
            return { ...w, ...restore, settings: { ...(w.settings || {}), expanded: false } }
          }
          // If collapsing profile-picture, also collapse profile widget
          if (widget.type === 'profile-picture' && w.type === 'profile' && w.settings?.expanded) {
            const { originalWidth: profW, originalHeight: profH, originalX: profX, originalY: profY } = w.settings || {}
            const profRestore = { x: profX || w.x, y: profY || w.y, width: profW || w.width, height: profH || w.height }
            const newSettings = { ...(w.settings || {}) }
            delete newSettings.expanded
            delete newSettings.originalWidth
            delete newSettings.originalHeight
            delete newSettings.originalX
            delete newSettings.originalY
            delete newSettings.adjusted
            return { ...w, ...profRestore, settings: Object.keys(newSettings).length > 0 ? newSettings : undefined }
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
    const cookieName = isMobile() ? COOKIE_NAME_DEFAULT_MOBILE : COOKIE_NAME_DEFAULT
    setCookie(cookieName, layoutToSave)
    showToast(`Current layout saved as ${isMobile() ? 'mobile ' : ''}default!`)
  }, [widgets, showToast])

  // Revert to default layout
  const revertToDefault = useCallback(() => {
    // Try to load default layout from cookie (mobile or desktop)
    const mobile = isMobile()
    const defaultCookieName = mobile ? COOKIE_NAME_DEFAULT_MOBILE : COOKIE_NAME_DEFAULT
    const defaultLayout = getCookie(defaultCookieName)
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
            if (widget.type === 'single-game' && (!settings.gameId || !GAME_IDS.includes(settings.gameId))) {
              settings = { gameId: GAME_IDS[0] }
            }
            // Initialize expandable settings
            if (widget.type === 'profile-picture' && !settings.expandable) {
              settings = { ...settings, expandable: true, expandScaleX: 2, expandScaleY: 2 }
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
      
      // Use flushSync to ensure the state update happens synchronously (like addWidget does)
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
    
    // Use flushSync to ensure the state update happens synchronously
    flushSync(() => {
      setWidgets(defaultWidgets)
    })
    
    // Animate widgets in immediately after state update
    setTimeout(() => {
      animateWidgetsIn()
    }, 50)
    
    showToast('Layout reverted to default!')
  }, [setWidgets, showToast, animateWidgetsIn, centerOffset])

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
          settings = { gameId: GAME_IDS[0] } // Default to first game
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
    if (previousViewRef.current === 'game-detail' || previousViewRef.current === 'cv-detail') {
      const animateIn = await transition()
      originalNavigateToMain()
      await animateIn()
    } else {
      originalNavigateToMain()
    }
    previousViewRef.current = 'main'
  }, [transition, originalNavigateToMain])

  const navigateToCV = useCallback(async () => {
    if (previousViewRef.current === 'main') {
      const animateIn = await transition()
      originalNavigateToCV()
      await animateIn()
    } else {
      originalNavigateToCV()
    }
    previousViewRef.current = 'cv-detail'
  }, [transition, originalNavigateToCV])

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
    const mobile = isMobile()
    
    // Initialize desktop defaults
    const defaultLayout = getCookie(COOKIE_NAME_DEFAULT)
    if (!defaultLayout || !Array.isArray(defaultLayout) || defaultLayout.length === 0) {
      // Set default homepage layout from single source of truth
      setCookie(COOKIE_NAME_DEFAULT, DEFAULT_HOMEPAGE_LAYOUT)
    }
    
    // Initialize mobile defaults (only if on mobile and not already set)
    if (mobile) {
      const mobileDefaultLayout = getCookie(COOKIE_NAME_DEFAULT_MOBILE)
      if (!mobileDefaultLayout || !Array.isArray(mobileDefaultLayout) || mobileDefaultLayout.length === 0) {
        // Set mobile default layout from single source of truth
        setCookie(COOKIE_NAME_DEFAULT_MOBILE, DEFAULT_HOMEPAGE_LAYOUT_MOBILE)
      }
    }
    
    // Also check game detail default (desktop)
    const gameDetailDefault = getCookie(COOKIE_NAME_DEFAULT_GAME_DETAIL)
    if (!gameDetailDefault || !Array.isArray(gameDetailDefault) || gameDetailDefault.length === 0) {
      // Set default game detail layout from single source of truth
      setCookie(COOKIE_NAME_DEFAULT_GAME_DETAIL, DEFAULT_GAME_DETAIL_LAYOUT)
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

  // Show CV detail view if selected
  if (currentView === 'cv-detail') {
    return <CVDetailView onBack={navigateToMain} />
  }

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
        onCVClick={navigateToCV}
        centerOffset={centerOffset}
        onUpdateWidgetSettings={updateWidgetSettings}
        onToggleWidgetExpand={toggleWidgetExpand}
      />
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
