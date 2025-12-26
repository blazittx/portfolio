// Utility script to set default layouts from cookie values
// Run this in the browser console or import and call setDefaultLayouts()

import { setCookie } from './cookies'
import { COOKIE_NAME_DEFAULT, COOKIE_NAME_DEFAULT_GAME_DETAIL, COOKIE_NAME_DEFAULT_MOBILE, COOKIE_NAME_DEFAULT_GAME_DETAIL_MOBILE } from '../constants/grid'

// Single source of truth for default layouts
// Decoded homepage layout
export const DEFAULT_HOMEPAGE_LAYOUT = [
  {"id":"profile","type":"profile","x":163.2,"y":26.4,"width":246,"height":111,"locked":false,"pinned":true,"settings":{"expandable":true,"expandScaleX":1,"expandScaleY":2}},
  {"id":"about","type":"about","x":433.2,"y":26.4,"width":291,"height":111,"locked":false,"pinned":true,"settings":{"adjusted":true}},
  {"id":"contact","type":"contact","x":748.2,"y":26.4,"width":246,"height":111,"locked":false,"pinned":true,"settings":{}},
  {"id":"single-game","type":"single-game","x":1018.2,"y":431.4,"width":516,"height":426,"locked":false,"pinned":true,"settings":{"gameId":"pullbackracers"}},
  {"id":"single-game-3","type":"single-game","x":1018.2,"y":25.4,"width":516,"height":381,"locked":false,"pinned":true,"settings":{"gameId":"gamblelite"}},
  {"id":"github","type":"github","x":28.2,"y":161.4,"width":381,"height":561,"locked":false,"pinned":false,"settings":{"adjusted":true}},
  {"id":"games","type":"games","x":433.2,"y":161.4,"width":561,"height":561,"locked":false,"pinned":false,"settings":{"adjusted":true}},
  {"id":"apikey","type":"apikey","x":388.2,"y":746.4,"width":336,"height":111,"locked":false,"pinned":false,"settings":{}},
  {"id":"time","type":"time","x":748.2,"y":746.4,"width":246,"height":111,"locked":false,"pinned":false,"settings":{}},
  {"id":"profile-picture","type":"profile-picture","x":28.2,"y":26.4,"width":111,"height":111,"locked":false,"pinned":false,"settings":{"expandable":true,"expandScaleX":2,"expandScaleY":2,"expanded":false,"originalWidth":111,"originalHeight":111,"originalX":28.2,"originalY":26.4}},
  {"id":"visitors","type":"visitors","x":28.2,"y":746.4,"width":111,"height":111,"locked":false,"pinned":false,"settings":{}},
  {"id":"heartbeat","type":"heartbeat","x":163.2,"y":746.4,"width":201,"height":111,"locked":false,"pinned":false,"settings":{}}
]

// Decoded game detail layout
export const DEFAULT_GAME_DETAIL_LAYOUT = [
  {"id":"back-button","type":"back-button","x":28.2,"y":26.4,"width":111,"height":66,"locked":true,"pinned":false},
  {"id":"game-info","type":"game-info","x":163.2,"y":26.4,"width":696,"height":66,"locked":true,"pinned":false},
  {"id":"game-description","type":"game-description","x":28.2,"y":611.4,"width":516,"height":246,"locked":false,"pinned":true},
  {"id":"game-image","type":"game-image","x":28.2,"y":116.4,"width":516,"height":471,"locked":false,"pinned":true},
  {"id":"game-details","type":"game-details","x":883.2,"y":26.4,"width":651,"height":66,"locked":true,"pinned":false},
  {"id":"game-development-info","type":"game-development-info","x":568.2,"y":116.4,"width":966,"height":741,"locked":false,"pinned":false}
]

// Mobile default layouts
// Mobile homepage layout
export const DEFAULT_HOMEPAGE_LAYOUT_MOBILE = [
  {"id":"profile","type":"profile","x":163.2,"y":26.4,"width":201,"height":111,"locked":false,"pinned":true,"settings":{"expandable":true,"expandScaleX":1,"expandScaleY":2}},
  {"id":"about","type":"about","x":28.2,"y":161.4,"width":336,"height":111,"locked":false,"pinned":true,"settings":{"adjusted":true}},
  {"id":"contact","type":"contact","x":28.2,"y":1461,"width":336,"height":111,"locked":false,"pinned":true,"settings":{}},
  {"id":"single-game","type":"single-game","x":28.2,"y":701.4,"width":336,"height":381,"locked":false,"pinned":true,"settings":{"gameId":"pullbackracers"}},
  {"id":"single-game-3","type":"single-game","x":28.2,"y":296.4,"width":336,"height":381,"locked":false,"pinned":true,"settings":{"gameId":"gamblelite"}},
  {"id":"games","type":"games","x":28.2,"y":1106.4,"width":336,"height":336,"locked":false,"pinned":false,"settings":{"adjusted":true}},
  {"id":"profile-picture","type":"profile-picture","x":28.2,"y":26.4,"width":111,"height":111,"locked":false,"pinned":false,"settings":{"expandable":true,"expandScaleX":2,"expandScaleY":2,"expanded":false,"originalWidth":111,"originalHeight":111,"originalX":28.2,"originalY":26.4}}
]

export const DEFAULT_GAME_DETAIL_LAYOUT_MOBILE = [
  {"id":"back-button","type":"back-button","x":28.2,"y":26.4,"width":111,"height":66,"locked":true,"pinned":false},
  {"id":"game-info","type":"game-info","x":28.2,"y":116.4,"width":291,"height":201,"locked":false,"pinned":true},
  {"id":"game-description","type":"game-description","x":28.2,"y":701.4,"width":336,"height":201,"locked":false,"pinned":true},
  {"id":"game-image","type":"game-image","x":28.2,"y":341.4,"width":336,"height":336,"locked":false,"pinned":true},
  {"id":"game-development-info","type":"game-development-info","x":28.2,"y":926.4,"width":336,"height":1056,"locked":false,"pinned":false}
]

/**
 * Set the default layouts for both main page and game detail page
 * This function can be called from the browser console or imported
 */
export const setDefaultLayouts = () => {
  setCookie(COOKIE_NAME_DEFAULT, DEFAULT_HOMEPAGE_LAYOUT)
  setCookie(COOKIE_NAME_DEFAULT_GAME_DETAIL, DEFAULT_GAME_DETAIL_LAYOUT)
  console.log('Default layouts set successfully!')
  console.log('Homepage layout:', DEFAULT_HOMEPAGE_LAYOUT)
  console.log('Game detail layout:', DEFAULT_GAME_DETAIL_LAYOUT)
  return {
    homepage: DEFAULT_HOMEPAGE_LAYOUT,
    gameDetail: DEFAULT_GAME_DETAIL_LAYOUT
  }
}

/**
 * Set the mobile default layouts for both main page and game detail page
 * This function can be called from the browser console or imported
 * User will provide the actual layout data via cookies
 */
export const setDefaultLayoutsMobile = (homepageLayout, gameDetailLayout) => {
  if (homepageLayout) {
    setCookie(COOKIE_NAME_DEFAULT_MOBILE, homepageLayout)
  }
  if (gameDetailLayout) {
    setCookie(COOKIE_NAME_DEFAULT_GAME_DETAIL_MOBILE, gameDetailLayout)
  }
  console.log('Mobile default layouts set successfully!')
  console.log('Mobile homepage layout:', homepageLayout)
  console.log('Mobile game detail layout:', gameDetailLayout)
  return {
    homepage: homepageLayout,
    gameDetail: gameDetailLayout
  }
}

// If running in browser console, expose the functions
if (typeof window !== 'undefined') {
  window.setDefaultLayouts = setDefaultLayouts
  window.setDefaultLayoutsMobile = setDefaultLayoutsMobile
}



