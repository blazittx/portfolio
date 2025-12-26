import { useState, useEffect } from 'react'

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState(null) // { widgetId, x, y }

  // Close context menu on click outside or Escape key
  useEffect(() => {
    if (!contextMenu) return

    const handleClickOutside = (e) => {
      const contextMenuElement = document.querySelector('.context-menu')
      if (contextMenuElement && !contextMenuElement.contains(e.target)) {
        setContextMenu(null)
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setContextMenu(null)
      }
    }

    // Use a small delay to avoid closing immediately when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true)
      document.addEventListener('click', handleClickOutside, true)
      document.addEventListener('keydown', handleEscape)
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('click', handleClickOutside, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu])

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

