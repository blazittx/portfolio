export const GRID_SIZE = 45;
export const GRID_OFFSET_X = GRID_SIZE * 0.36; // 16.2px
export const GRID_OFFSET_Y = GRID_SIZE * 0.32; // 14.4px
export const WIDGET_PADDING = 12; // Padding from grid lines - increase this value for more distance
export const USABLE_GRID_WIDTH = 34; // Number of grid cells wide (desktop)
export const USABLE_GRID_HEIGHT = 19; // Number of grid cells high (desktop)
export const USABLE_GRID_WIDTH_MOBILE = 8; // Number of grid cells wide (mobile)
export const USABLE_GRID_HEIGHT_MOBILE = 41; // Number of grid cells high (mobile - allows scrolling)
export const USABLE_GRID_WIDTH_CV = 13; // Number of grid cells wide (CV - A4 aspect ratio)
export const USABLE_GRID_HEIGHT_CV = 19; // Number of grid cells high (CV - A4 aspect ratio)
// Mobile breakpoint - screens smaller than this are considered mobile
export const MOBILE_BREAKPOINT = 768;

// Convert grid units to pixel size (accounting for padding)
// gridUnits: number of grid cells (e.g., 2 = 2 grid units wide)
// Returns: pixel size that fits within those grid units
export const gridUnitsToPixels = (gridUnits) => {
  // Formula: (gridUnits * GRID_SIZE) - (WIDGET_PADDING * 2)
  // This accounts for padding on both sides
  return gridUnits * GRID_SIZE - WIDGET_PADDING * 2;
};

// Get minimum size for a widget type based on content requirements
// Now accepts grid units instead of pixel values
export const getWidgetMinSize = (widgetType) => {
  // Minimum sizes in grid units (width, height)
  // These are based on content needs: headers, text, lists, etc.
  const minSizesInGridUnits = {
    profile: { width: 3, height: 3 },
    about: { width: 3, height: 3 },
    skills: { width: 3, height: 3 },
    contact: { width: 3, height: 3 },
    games: { width: 3, height: 3 },
    visitors: { width: 3, height: 3 },
    motd: { width: 3, height: 3 },
    time: { width: 3, height: 3 },
    github: { width: 3, height: 3 },
    apikey: { width: 3, height: 3 },
    "single-game": { width: 3, height: 3 },
    "profile-picture": { width: 3, height: 3 },
    "back-button": { width: 3, height: 3 },
    "game-info": { width: 3, height: 3 },
    "game-description": { width: 3, height: 3 },
    "game-image": { width: 3, height: 3 },
    "game-details": { width: 3, height: 3 },
    "game-development-info": { width: 3, height: 3 },
    heartbeat: { width: 3, height: 3 },
    cv: { width: 3, height: 3 },
    experience: { width: 3, height: 3 },
    education: { width: 3, height: 3 },
    projects: { width: 3, height: 3 },
    "technical-skills": { width: 3, height: 3 },
    languages: { width: 3, height: 3 },
    certifications: { width: 3, height: 3 },
  };

  const gridUnits = minSizesInGridUnits[widgetType] || { width: 2, height: 2 };

  return {
    width: gridUnitsToPixels(gridUnits.width),
    height: gridUnitsToPixels(gridUnits.height),
  };
};
