// Utility script to set default layouts from cookie values
// Run this in the browser console or import and call setDefaultLayouts()

import { setCookie } from './cookies'
import { COOKIE_NAME_DEFAULT, COOKIE_NAME_DEFAULT_GAME_DETAIL } from '../constants/grid'

// Decoded homepage layout
const homepageLayout = [
  {"id":"profile","type":"profile","x":28.2,"y":26.4,"width":246,"height":111,"locked":false,"pinned":true},
  {"id":"about","type":"about","x":298.2,"y":26.4,"width":291,"height":111,"locked":false,"pinned":true},
  {"id":"contact","type":"contact","x":1288.2,"y":746.4,"width":239.79999999999995,"height":111,"locked":false,"pinned":true},
  {"id":"games","type":"games","x":28.2,"y":161.4,"width":561,"height":696,"locked":false,"pinned":true},
  {"id":"visitors","type":"visitors","x":1153.2,"y":746.4,"width":111,"height":111,"locked":false,"pinned":true},
  {"id":"time","type":"time","x":1288.2,"y":26.4,"width":239.79999999999995,"height":111,"locked":false,"pinned":true},
  {"id":"github","type":"github","x":1153.2,"y":161.4,"width":374.79999999999995,"height":561,"locked":false,"pinned":true},
  {"id":"skills","type":"skills","x":613.2,"y":791.4,"width":516,"height":66,"locked":false,"pinned":false},
  {"id":"apikey","type":"apikey","x":1018.2,"y":26.4,"width":246,"height":111,"locked":false,"pinned":true}
]

// Decoded game detail layout
const gameDetailLayout = [
  {"id":"back-button","type":"back-button","x":28.2,"y":26.4,"width":111,"height":66,"locked":true,"pinned":false},
  {"id":"game-info","type":"game-info","x":613.2,"y":116.4,"width":246,"height":201,"locked":false,"pinned":false},
  {"id":"game-description","type":"game-description","x":1108.2,"y":116.4,"width":419.79999999999995,"height":201,"locked":false,"pinned":false},
  {"id":"game-image","type":"game-image","x":28.2,"y":116.4,"width":561,"height":741,"locked":false,"pinned":false},
  {"id":"game-details","type":"game-details","x":883.2,"y":116.4,"width":201,"height":201,"locked":false,"pinned":false}
]

/**
 * Set the default layouts for both main page and game detail page
 * This function can be called from the browser console or imported
 */
export const setDefaultLayouts = () => {
  setCookie(COOKIE_NAME_DEFAULT, homepageLayout)
  setCookie(COOKIE_NAME_DEFAULT_GAME_DETAIL, gameDetailLayout)
  console.log('Default layouts set successfully!')
  console.log('Homepage layout:', homepageLayout)
  console.log('Game detail layout:', gameDetailLayout)
  return {
    homepage: homepageLayout,
    gameDetail: gameDetailLayout
  }
}

// If running in browser console, expose the function
if (typeof window !== 'undefined') {
  window.setDefaultLayouts = setDefaultLayouts
}


