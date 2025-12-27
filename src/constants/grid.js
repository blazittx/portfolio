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
export const COOKIE_NAME = "widgetLayout";
export const COOKIE_NAME_GAME_DETAIL = "widgetLayoutGameDetail";
export const COOKIE_NAME_DEFAULT = "widgetLayoutDefault";
export const COOKIE_NAME_DEFAULT_GAME_DETAIL = "widgetLayoutDefaultGameDetail";
export const COOKIE_NAME_DEFAULT_MOBILE = "widgetLayoutDefaultMobile";
export const COOKIE_NAME_DEFAULT_GAME_DETAIL_MOBILE =
  "widgetLayoutDefaultGameDetailMobile";
export const COOKIE_NAME_CV_DETAIL = "widgetLayoutCVDetail";
export const COOKIE_NAME_DEFAULT_CV_DETAIL = "widgetLayoutDefaultCVDetail";
export const COOKIE_NAME_DEFAULT_CV_DETAIL_MOBILE = "widgetLayoutDefaultCVDetailMobile";

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
    profile: { width: 1, height: 1 },
    about: { width: 1, height: 1 },
    skills: { width: 1, height: 1 },
    contact: { width: 1, height: 1 },
    games: { width: 1, height: 1 },
    visitors: { width: 1, height: 1 },
    motd: { width: 1, height: 1 },
    time: { width: 1, height: 1 },
    github: { width: 1, height: 1 },
    apikey: { width: 1, height: 1 },
    "single-game": { width: 1, height: 1 },
    "profile-picture": { width: 1, height: 1 },
    "back-button": { width: 1, height: 1 },
    "game-info": { width: 1, height: 1 },
    "game-description": { width: 1, height: 1 },
    "game-image": { width: 1, height: 1 },
    "game-details": { width: 1, height: 1 },
    "game-development-info": { width: 1, height: 1 },
    heartbeat: { width: 1, height: 1 },
    cv: { width: 1, height: 1 },
    "experience": { width: 1, height: 1 },
    "education": { width: 1, height: 1 },
    "projects": { width: 1, height: 1 },
    "technical-skills": { width: 1, height: 1 },
    "languages": { width: 1, height: 1 },
    "certifications": { width: 1, height: 1 },
  };

  const gridUnits = minSizesInGridUnits[widgetType] || { width: 2, height: 2 };

  return {
    width: gridUnitsToPixels(gridUnits.width),
    height: gridUnitsToPixels(gridUnits.height),
  };
};
