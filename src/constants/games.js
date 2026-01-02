// Centralized game constants
// This file contains all game IDs, URLs, and mappings used across the application

export const GAME_IDS = [
  "pullbackracers",
  "bubbledome",
  "gamblelite",
  "gp1",
  "Forgekeepers",
  "GFOS1992",
  "gp3",
];

// Manual Steam URL mapping for games
export const STEAM_URLS = {
  gamblelite:
    "https://store.steampowered.com/app/3892270/Gamble_With_Your_Friends",
  pullbackracers: "https://store.steampowered.com/app/3720110/PULLBACK_RACERS",
  Forgekeepers: "https://store.steampowered.com/app/3254140/Forgekeepers",
};

// Manual YouTube URL mapping for games
export const YOUTUBE_URLS = {
  gp1: "https://www.youtube.com/watch?v=ahNtZkPkLwk",
  pullbackracers: "https://www.youtube.com/watch?v=rverpDDUjKA",
  gamblelite: "https://www.youtube.com/watch?v=xHO0eRE6NxM",
  Forgekeepers: "https://www.youtube.com/watch?v=QcgpHLj85cg",
  GFOS1992: "https://www.youtube.com/watch?v=csXpdMuZkp8",
  bubbledome: "https://www.youtube.com/watch?v=TyFXXudBoJQ",
  gp3: "https://www.youtube.com/watch?v=xOGphs5bCkk",
};

// Technology chips per game (displayed as badges)
export const GAME_CHIPS = {
  pullbackracers: ["Unity", "C#"],
  bubbledome: ["Unity", "C#"],
  gamblelite: ["Unity", "C#"],
  gp1: ["Unity", "C#"],
  Forgekeepers: ["Unity", "C#"],
  GFOS1992: ["Unity", "C#"],
  gp3: ["Unreal Engine", "C++"],
};

// Links per game (displayed as chips with icons)
export const GAME_LINKS = {
  pullbackracers: [
    { type: "steam", url: STEAM_URLS.pullbackracers, label: "Steam" },
  ],
  bubbledome: [],
  gamblelite: [{ type: "steam", url: STEAM_URLS.gamblelite, label: "Steam" }],
  gp1: [],
  Forgekeepers: [
    { type: "steam", url: STEAM_URLS.Forgekeepers, label: "Steam" },
  ],
  GFOS1992: [],
};

// Helper functions to get chips and links for a game
export function getGameChips(gameId) {
  return GAME_CHIPS[gameId] || [];
}

export function getGameLinks(gameId) {
  return GAME_LINKS[gameId] || [];
}
