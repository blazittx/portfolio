// Utility to check if we're in development mode
export const isDevMode = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.DEV || import.meta.env.MODE === 'development'
  }
  // Fallback: assume production if import.meta is not available
  return false
}

