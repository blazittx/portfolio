import { useState, useEffect } from 'react'
import { getCookie, setCookie } from '../utils/cookies'
import { COOKIE_NAME, getWidgetMinSize } from '../constants/grid'
import { snapToGrid, snapSizeToGrid, constrainToViewport, constrainSizeToViewport } from '../utils/grid'
import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../constants/grid'
import ProfileWidget from '../components/ProfileWidget'
import AboutWidget from '../components/AboutWidget'
import SkillsWidget from '../components/SkillsWidget'
import ContactWidget from '../components/ContactWidget'
import GamesWidget from '../components/GamesWidget'
import VisitorsWidget from '../components/VisitorsWidget'
import MessageOfTheDayWidget from '../components/MessageOfTheDayWidget'
import QuoteWidget from '../components/QuoteWidget'
import TimeWidget from '../components/TimeWidget'

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
  time: TimeWidget
}

export const useWidgets = () => {
  // Initialize widget positions - load from cookie or use defaults
  const [widgets, setWidgets] = useState(() => {
    try {
      // Try to load from cookie
      const savedLayout = getCookie(COOKIE_NAME)
      
      if (savedLayout && Array.isArray(savedLayout)) {
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
      
      // Default layout
      const baseX = snapToGrid(100, GRID_OFFSET_X)
      const baseY = snapToGrid(100, GRID_OFFSET_Y)
    
    // Calculate widget sizes first
    const profileWidth = snapSizeToGrid(270) // 6 grid units
    const profileHeight = snapSizeToGrid(180) // 4 grid units
    const aboutWidth = snapSizeToGrid(225) // 5 grid units
    const aboutHeight = snapSizeToGrid(180) // 4 grid units
    const skillsWidth = snapSizeToGrid(225) // 5 grid units
    const skillsHeight = snapSizeToGrid(135) // 3 grid units
    const contactWidth = snapSizeToGrid(225) // 5 grid units
    const contactHeight = snapSizeToGrid(90) // 2 grid units
    const gamesWidth = snapSizeToGrid(270) // 6 grid units
    const gamesHeight = snapSizeToGrid(180) // 4 grid units
    
    // Calculate positions, ensuring they snap to grid
    const aboutX = baseX + profileWidth + GRID_SIZE
    const aboutXSnapped = snapToGrid(aboutX, GRID_OFFSET_X)
    
    const skillsY = baseY + profileHeight + GRID_SIZE
    const skillsYSnapped = snapToGrid(skillsY, GRID_OFFSET_Y)
    
    const skillsX = aboutXSnapped
    const contactX = skillsX
    const contactY = skillsYSnapped + skillsHeight + GRID_SIZE
    const contactYSnapped = snapToGrid(contactY, GRID_OFFSET_Y)
    
    // Place games widget below profile widget
    const gamesX = baseX
    const gamesXSnapped = snapToGrid(gamesX, GRID_OFFSET_X)
    const gamesY = skillsYSnapped
    const gamesYSnapped = snapToGrid(gamesY, GRID_OFFSET_Y)
    
    return [
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
    setCookie(COOKIE_NAME, layoutToSave)
  }, [widgets])

  return [widgets, setWidgets]
}

