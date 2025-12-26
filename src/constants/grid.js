export const GRID_SIZE = 45
export const GRID_OFFSET_X = GRID_SIZE * 0.36  // 16.2px
export const GRID_OFFSET_Y = GRID_SIZE * 0.32  // 14.4px
export const WIDGET_PADDING = 12  // Padding from grid lines - increase this value for more distance
export const COOKIE_NAME = 'widgetLayout'

// Get minimum size for a widget type based on content requirements
export const getWidgetMinSize = (widgetType) => {
  // Minimum sizes that allow meaningful content display
  // These are based on content needs: headers, text, lists, etc.
  const minSizes = {
    profile: { width: 180, height: 120 },  // Header + basic info
    about: { width: 150, height: 100 },     // Text content
    skills: { width: 120, height: 80 },      // A few skill tags
    contact: { width: 120, height: 60 },    // At least one contact link
    games: { width: 180, height: 150 },      // Game card with image
    visitors: { width: 120, height: 100 },    // Visitor count display
    motd: { width: 150, height: 100 },       // Message of the day
    quote: { width: 150, height: 120 },      // Quote with author
    time: { width: 140, height: 100 }        // Time and date display
  }
  
  return minSizes[widgetType] || { width: 100, height: 80 } // Default fallback
}

