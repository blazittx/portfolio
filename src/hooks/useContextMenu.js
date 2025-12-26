import { useState, useEffect } from 'react'

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState(null) // { widgetId, x, y }

  // Close context menu on left click outside (not on right-click releases)
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Only close on left clicks, ignore right-clicks
      if (e.button === undefined || e.button === 0) {
        const contextMenuElement = document.querySelector('.context-menu')
        if (contextMenuElement && !contextMenuElement.contains(e.target)) {
          setContextMenu(null)
        }
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const openContextMenu = (e, widgetId = null) => {
    // Always prevent default and open menu
    // widgetId can be null for empty space clicks
    e.preventDefault()
    setContextMenu({
      widgetId,
      x: e.clientX,
      y: e.clientY
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu
  }
}

