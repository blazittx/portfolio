export const GRID_SIZE = 45;
export const GRID_OFFSET_X = GRID_SIZE * 0.36; // 16.2px
export const GRID_OFFSET_Y = GRID_SIZE * 0.32; // 14.4px
export const WIDGET_PADDING = 12; // Padding from grid lines - increase this value for more distance
export const COOKIE_NAME = "widgetLayout";
export const COOKIE_NAME_GAME_DETAIL = "widgetLayoutGameDetail";
export const COOKIE_NAME_DEFAULT = "widgetLayoutDefault";
export const COOKIE_NAME_DEFAULT_GAME_DETAIL = "widgetLayoutDefaultGameDetail";

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
    profile: { width: 4, height: 3 },
    about: { width: 3, height: 2 },
    skills: { width: 3, height: 2 },
    contact: { width: 6, height: 2 },
    games: { width: 4, height: 3 },
    visitors: { width: 3, height: 2 },
    motd: { width: 3, height: 2 },
    quote: { width: 3, height: 3 },
    time: { width: 3, height: 2 },
    github: { width: 4, height: 3 },
    apikey: { width: 4, height: 2 },
  };

  const gridUnits = minSizesInGridUnits[widgetType] || { width: 2, height: 2 };

  return {
    width: gridUnitsToPixels(gridUnits.width),
    height: gridUnitsToPixels(gridUnits.height),
  };
};
