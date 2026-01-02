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
    profile: { width: 2, height: 2 },
    about: { width: 2, height: 2 },
    skills: { width: 2, height: 2 },
    contact: { width: 2, height: 2 },
    games: { width: 2, height: 2 },
    visitors: { width: 2, height: 2 },
    motd: { width: 2, height: 2 },
    time: { width: 2, height: 2 },
    github: { width: 2, height: 2 },
    apikey: { width: 2, height: 2 },
    "single-game": { width: 2, height: 2 },
    "profile-picture": { width: 2, height: 2 },
    "back-button": { width: 2, height: 2 },
    "game-info": { width: 2, height: 2 },
    "game-description": { width: 2, height: 2 },
    "game-image": { width: 2, height: 2 },
    "game-details": { width: 2, height: 2 },
    "game-development-info": { width: 2, height: 2 },
    heartbeat: { width: 2, height: 2 },
    cv: { width: 2, height: 2 },
    experience: { width: 2, height: 2 },
    education: { width: 2, height: 2 },
    projects: { width: 2, height: 2 },
    "technical-skills": { width: 2, height: 2 },
    languages: { width: 2, height: 2 },
    certifications: { width: 2, height: 2 },
  };

  const gridUnits = minSizesInGridUnits[widgetType] || { width: 2, height: 2 };

  return {
    width: gridUnitsToPixels(gridUnits.width),
    height: gridUnitsToPixels(gridUnits.height),
  };
};
