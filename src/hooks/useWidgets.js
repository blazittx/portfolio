import { useState, useEffect } from 'react'
import { getCookie, setCookie } from '../utils/cookies'
import { COOKIE_NAME, COOKIE_NAME_GAME_DETAIL, COOKIE_NAME_DEFAULT } from '../constants/grid'
import { snapToGrid, snapSizeToGrid, constrainToViewport, constrainSizeToViewport } from '../utils/grid'
import { GRID_OFFSET_X, GRID_OFFSET_Y } from '../constants/grid'
import ProfileWidget from '../components/ProfileWidget'
import AboutWidget from '../components/AboutWidget'
import SkillsWidget from '../components/SkillsWidget'
import ContactWidget from '../components/ContactWidget'
import GamesWidget from '../components/GamesWidget'
import VisitorsWidget from '../components/VisitorsWidget'
import MessageOfTheDayWidget from '../components/MessageOfTheDayWidget'
import QuoteWidget from '../components/QuoteWidget'
import TimeWidget from '../components/TimeWidget'
import GitHubActivityWidget from '../components/GitHubActivityWidget'
import ApiKeyWidget from '../components/ApiKeyWidget'

// Default homepage layout (from user's current setup)
const DEFAULT_HOMEPAGE_LAYOUT = [
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

// Component mapping - exported for use in other components
export const componentMap = {
  profile: ProfileWidget,
  about: AboutWidget,
  skills: SkillsWidget,
  contact: ContactWidget,
  games: GamesWidget,
  visitors: VisitorsWidget,
  motd: MessageOfTheDayWidget,
  quote: QuoteWidget,
  time: TimeWidget,
  github: GitHubActivityWidget,
  apikey: ApiKeyWidget
}

export const useWidgets = (view = 'main') => {
  // Determine which cookie to use based on view
  const cookieName = view === 'game-detail' ? COOKIE_NAME_GAME_DETAIL : COOKIE_NAME
  
  // Initialize widget positions - load from cookie or use defaults
  const [widgets, setWidgets] = useState(() => {
    // For game-detail view, return empty array - let GameDetailView handle initialization
    if (view === 'game-detail') {
      return []
    }
    
    try {
      // Try to load from cookie
      const savedLayout = getCookie(cookieName)
      
      if (savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) {
        // Restore from cookie, ensuring components are mapped correctly and constrained to viewport
        // Filter out widgets with missing components to prevent crashes
        const restoredWidgets = savedLayout
        .map(widget => {
          try {
            const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height)
            const constrainedSize = constrainSizeToViewport(constrainedPos.x, constrainedPos.y, widget.width, widget.height)
            const component = componentMap[widget.type] || componentMap[widget.id]
            
            // Only include widgets with valid components
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
      
      // If no saved layout, try to load default layout
      const defaultLayout = getCookie(COOKIE_NAME_DEFAULT)
      if (defaultLayout && Array.isArray(defaultLayout) && defaultLayout.length > 0) {
        // Restore from default layout
        const restoredWidgets = defaultLayout
        .map(widget => {
          try {
            const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height)
            const constrainedSize = constrainSizeToViewport(constrainedPos.x, constrainedPos.y, widget.width, widget.height)
            const component = componentMap[widget.type] || componentMap[widget.id]
            
            // Only include widgets with valid components
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
      
      // Use hardcoded default layout from user's current setup
      // Map the default layout to include component references
      return DEFAULT_HOMEPAGE_LAYOUT
        .map(widget => {
          try {
            const constrainedPos = constrainToViewport(widget.x, widget.y, widget.width, widget.height)
            const constrainedSize = constrainSizeToViewport(constrainedPos.x, constrainedPos.y, widget.width, widget.height)
            const component = componentMap[widget.type] || componentMap[widget.id]
            
            // Only include widgets with valid components
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
    setCookie(cookieName, layoutToSave)
  }, [widgets, cookieName, view])

  return [widgets, setWidgets]
}

