import { useState, useEffect } from 'react'
import { getCookie, setCookie } from '../utils/cookies'
import { COOKIE_NAME, COOKIE_NAME_GAME_DETAIL, COOKIE_NAME_DEFAULT, COOKIE_NAME_DEFAULT_MOBILE } from '../constants/grid'
import { snapToGrid, snapSizeToGrid, constrainToViewport } from '../utils/grid'
import { getWidgetMinSize } from '../constants/grid'
import { GRID_OFFSET_X, GRID_OFFSET_Y } from '../constants/grid'
import { DEFAULT_HOMEPAGE_LAYOUT, DEFAULT_HOMEPAGE_LAYOUT_MOBILE } from '../utils/setDefaultLayouts'
import { isMobile } from '../utils/mobile'
import ProfileWidget from '../components/ProfileWidget'
import AboutWidget from '../components/AboutWidget'
import SkillsWidget from '../components/SkillsWidget'
import ContactWidget from '../components/ContactWidget'
import GamesWidget from '../components/GamesWidget'
import VisitorsWidget from '../components/VisitorsWidget'
import MessageOfTheDayWidget from '../components/MessageOfTheDayWidget'
import TimeWidget from '../components/TimeWidget'
import GitHubActivityWidget from '../components/GitHubActivityWidget'
import ApiKeyWidget from '../components/ApiKeyWidget'
import SingleGameWidget from '../components/SingleGameWidget'
import ProfilePictureWidget from '../components/ProfilePictureWidget'
import HeartbeatWidget from '../components/HeartbeatWidget'

// Component mapping - exported for use in other components
export const componentMap = {
  profile: ProfileWidget,
  about: AboutWidget,
  skills: SkillsWidget,
  contact: ContactWidget,
  games: GamesWidget,
  visitors: VisitorsWidget,
  motd: MessageOfTheDayWidget,
  time: TimeWidget,
  github: GitHubActivityWidget,
  apikey: ApiKeyWidget,
  'single-game': SingleGameWidget,
  'profile-picture': ProfilePictureWidget,
  heartbeat: HeartbeatWidget
}

export const useWidgets = (view = 'main') => {
  // Determine which cookie to use based on view and mobile state
  const mobile = isMobile()
  const cookieName = view === 'game-detail' ? COOKIE_NAME_GAME_DETAIL : COOKIE_NAME
  const defaultCookieName = mobile 
    ? (view === 'game-detail' ? null : COOKIE_NAME_DEFAULT_MOBILE) // Game detail mobile default handled in GameDetailView
    : (view === 'game-detail' ? null : COOKIE_NAME_DEFAULT)
  
  // Initialize widget positions - load from cookie or use defaults
  const [widgets, setWidgets] = useState(() => {
    // For game-detail view, return empty array - let GameDetailView handle initialization
    if (view === 'game-detail') {
      return []
    }
    
    try {
      // On mobile, always use default layout - ignore saved cookies
      if (mobile) {
        // Try to load default layout (mobile or desktop)
        const defaultLayout = defaultCookieName ? getCookie(defaultCookieName) : null
        if (defaultLayout && Array.isArray(defaultLayout) && defaultLayout.length > 0) {
          // Restore from default layout - use exact positions without constraining
          const restoredWidgets = defaultLayout
            .map(widget => {
              try {
                // Always use widget.type to look up component (not widget.id, which may have suffixes like -1, -2)
                const component = componentMap[widget.type]
                
                // Only include widgets with valid components
                if (!component) {
                  console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
                  return null
                }
                
                // Initialize default settings for widgets that need them
                let settings = widget.settings || {}
                if (widget.type === 'single-game' && (!settings.gameId || !['pullbackracers', 'bubbledome', 'gamblelite', 'gp1', 'Forgekeepers', 'GFOS1992'].includes(settings.gameId))) {
                  settings = { gameId: 'pullbackracers' }
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
          
          // Don't auto-add widgets - respect what the user has saved
          return restoredWidgets
        }
        
        // If no default layout, use hardcoded default - use exact positions without constraining
        return DEFAULT_HOMEPAGE_LAYOUT_MOBILE
          .map(widget => {
            try {
              // Always use widget.type to look up component (not widget.id, which may have suffixes like -1, -2)
              const component = componentMap[widget.type]
              
              // Only include widgets with valid components
              if (!component) {
                console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
                return null
              }
              
              // Initialize default settings for widgets that need them
              let settings = widget.settings || {}
              if (widget.type === 'single-game' && (!settings.gameId || !['pullbackracers', 'bubbledome', 'gamblelite', 'gp1', 'Forgekeepers', 'GFOS1992'].includes(settings.gameId))) {
                settings = { gameId: 'pullbackracers' }
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
      }
      
      // Try to load from cookie (desktop only)
      const savedLayout = getCookie(cookieName)
      
      if (savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) {
        // Restore from cookie, ensuring components are mapped correctly and constrained to viewport
        // Filter out widgets with missing components to prevent crashes
        const restoredWidgets = savedLayout
        .map(widget => {
          try {
            // Don't enforce usable area bounds when loading saved layouts - just ensure visibility
            const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height, { x: 0, y: 0 }, false)
            
            // Always use widget.type to look up component (not widget.id, which may have suffixes like -1, -2)
            const component = componentMap[widget.type]
            
            // Only include widgets with valid components
            if (!component) {
              console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
              return null
            }
            
            // Initialize default settings for widgets that need them
            let settings = widget.settings || {}
            if (widget.type === 'single-game' && (!settings.gameId || !['pullbackracers', 'bubbledome', 'gamblelite', 'gp1', 'Forgekeepers', 'GFOS1992'].includes(settings.gameId))) {
              settings = { gameId: 'pullbackracers' }
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
      
        // Don't auto-add widgets - respect what the user has saved
        return restoredWidgets
      }
      
      // If no saved layout, try to load default layout (mobile or desktop)
      const defaultLayout = defaultCookieName ? getCookie(defaultCookieName) : null
      if (defaultLayout && Array.isArray(defaultLayout) && defaultLayout.length > 0) {
        // Restore from default layout
        const restoredWidgets = defaultLayout
        .map(widget => {
          try {
            // Don't enforce usable area bounds when loading saved layouts - just ensure visibility
            const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height, { x: 0, y: 0 }, false)
            
            // Always use widget.type to look up component (not widget.id, which may have suffixes like -1, -2)
            const component = componentMap[widget.type]
            
            // Only include widgets with valid components
            if (!component) {
              console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
              return null
            }
            
            // Initialize default settings for widgets that need them
            let settings = widget.settings || {}
            if (widget.type === 'single-game' && (!settings.gameId || !['pullbackracers', 'bubbledome', 'gamblelite', 'gp1', 'Forgekeepers', 'GFOS1992'].includes(settings.gameId))) {
              settings = { gameId: 'pullbackracers' }
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
      
        // Don't auto-add widgets - respect what the user has saved
        return restoredWidgets
      }
      
      // Use hardcoded default layout from user's current setup (desktop only)
      // On mobile, if no mobile default is set, fall back to desktop default
      // Map the default layout to include component references
      return DEFAULT_HOMEPAGE_LAYOUT
        .map(widget => {
          try {
            // Don't enforce usable area bounds when loading saved layouts - just ensure visibility
            const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height, { x: 0, y: 0 }, false)
            
            // Always use widget.type to look up component (not widget.id, which may have suffixes like -1, -2)
            const component = componentMap[widget.type]
            
            // Only include widgets with valid components
            if (!component) {
              console.warn(`Widget component not found for type: ${widget.type}, id: ${widget.id}`)
              return null
            }
            
            // Initialize default settings for widgets that need them
            let settings = widget.settings || {}
            if (widget.type === 'single-game' && (!settings.gameId || !['pullbackracers', 'bubbledome', 'gamblelite', 'gp1', 'Forgekeepers', 'GFOS1992'].includes(settings.gameId))) {
              settings = { gameId: 'pullbackracers' }
            }
            // Initialize expandable settings
            if (widget.type === 'profile-picture' && !settings.expandable) {
              settings = { ...settings, expandable: true, expandScaleX: 2, expandScaleY: 2 }
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
            console.error(`Error creating widget ${widget.id}:`, error)
            return null
          }
        })
        .filter(widget => widget !== null)
    } catch (error) {
      console.error('Error creating default widget layout:', error)
      // Return minimal safe layout
      return [
        {
          id: 'profile',
          type: 'profile',
          x: snapToGrid(100, GRID_OFFSET_X),
          y: snapToGrid(100, GRID_OFFSET_Y),
          width: snapSizeToGrid(270),
          height: snapSizeToGrid(180),
          component: ProfileWidget,
          locked: false,
          pinned: false
        }
      ]
    }
  })

  // Save to cookie whenever widgets change
  useEffect(() => {
    // For game-detail view, don't save empty arrays (GameDetailView handles its own initialization)
    // This prevents overwriting saved layout with empty array on initial mount
    if (view === 'game-detail' && (!widgets || widgets.length === 0)) {
      return
    }
    
    // Only save position and size data, not component references
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
    setCookie(cookieName, layoutToSave)
  }, [widgets, cookieName, view])

  return [widgets, setWidgets]
}

