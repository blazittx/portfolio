// Mobile detection utility
import { MOBILE_BREAKPOINT } from '../constants/grid'

/**
 * Check if the current screen is considered mobile
 * @returns {boolean} True if screen width is below mobile breakpoint
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

