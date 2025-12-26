import { useEffect, useCallback, useRef } from 'react'
import { fillScreenWithWidgets } from '../utils/screenFill'
import { getCookie } from '../utils/cookies'
import { COOKIE_NAME, COOKIE_NAME_DEFAULT } from '../constants/grid'

/**
 * Hook to automatically adjust widget sizes to fill the screen
 * This runs on mount and window resize, but respects locked/pinned widgets
 * IMPORTANT: This will NOT run on initial mount if widgets were loaded from saved storage
 * to preserve user's custom widget sizes across reloads
 */
export const useScreenFill = (widgets, setWidgets, enabled = true) => {
  const isAdjustingRef = useRef(false)
  const resizeTimeoutRef = useRef(null)
  const hasInitializedRef = useRef(false)
  
  const adjustWidgetSizes = useCallback(() => {
    if (!enabled || !widgets || widgets.length === 0 || isAdjustingRef.current) {
      return
    }
    
    isAdjustingRef.current = true
    
    // Separate widgets into fixed (locked/pinned) and adjustable
    const fixedWidgets = widgets.filter(w => w.locked || w.pinned)
    const adjustableWidgets = widgets.filter(w => !w.locked && !w.pinned)
    
    if (adjustableWidgets.length === 0) {
      isAdjustingRef.current = false
      return
    }
    
    // Calculate optimal sizes for adjustable widgets
    // Fixed widgets are passed but not used - kept for API compatibility
    const adjustedWidgets = fillScreenWithWidgets(adjustableWidgets, fixedWidgets)
    
    // Merge fixed and adjusted widgets
    const allWidgets = [...fixedWidgets, ...adjustedWidgets]
    
    // Update widgets
    setWidgets(allWidgets)
    
    // Reset flag after a short delay to prevent rapid updates
    setTimeout(() => {
      isAdjustingRef.current = false
    }, 100)
  }, [widgets, setWidgets, enabled])
  
  // Adjust on initial mount only (when widgets are first loaded)
  // BUT: Skip if widgets were loaded from saved storage to preserve user's custom sizes
  useEffect(() => {
    if (enabled && widgets && widgets.length > 0 && !hasInitializedRef.current) {
      // Check if there's a saved layout or default layout - if so, widgets were loaded from storage
      // and we should preserve their sizes instead of adjusting them
      const savedLayout = getCookie(COOKIE_NAME)
      const defaultLayout = getCookie(COOKIE_NAME_DEFAULT)
      const hasSavedLayout = (savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) ||
                             (defaultLayout && Array.isArray(defaultLayout) && defaultLayout.length > 0)
      
      if (hasSavedLayout) {
        // Widgets were loaded from saved storage (either current or default layout)
        // Skip initial adjustment to preserve user's custom widget sizes
        hasInitializedRef.current = true
        return
      }
      
      // No saved layout - this is a fresh load, so run screen fill adjustment
      // Small delay to ensure viewport is ready
      const timeout = setTimeout(() => {
        adjustWidgetSizes()
        hasInitializedRef.current = true
      }, 300) // Slightly longer delay for initial load
      
      return () => clearTimeout(timeout)
    }
  }, [enabled, adjustWidgetSizes]) // Only run when enabled changes
  
  // Adjust on window resize (debounced) - DISABLED FOR NOW
  // useEffect(() => {
  //   if (!enabled) return
  //   
  //   const handleResize = () => {
  //     // Clear existing timeout
  //     if (resizeTimeoutRef.current) {
  //       clearTimeout(resizeTimeoutRef.current)
  //     }
  //     
  //     // Debounce resize handling
  //     resizeTimeoutRef.current = setTimeout(() => {
  //       adjustWidgetSizes()
  //     }, 250) // Wait 250ms after resize stops
  //   }
  //   
  //   window.addEventListener('resize', handleResize)
  //   
  //   return () => {
  //     window.removeEventListener('resize', handleResize)
  //     if (resizeTimeoutRef.current) {
  //       clearTimeout(resizeTimeoutRef.current)
  //     }
  //   }
  // }, [enabled, adjustWidgetSizes])
  
}

