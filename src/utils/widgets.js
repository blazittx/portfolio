// Widget metadata and utilities
export const WIDGET_INFO = {
  profile: { name: 'Profile', icon: '👤' },
  about: { name: 'About', icon: '📝' },
  skills: { name: 'Skills', icon: '⚡' },
  contact: { name: 'Contact', icon: '📧' },
  games: { name: 'Games', icon: '🎮' },
  visitors: { name: 'Visitors', icon: '👥' },
  motd: { name: 'Message of the Day', icon: '💬' },
  quote: { name: 'Quote', icon: '💭' },
  time: { name: 'Time', icon: '🕐' },
  github: { name: 'GitHub Activity', icon: '🐙' },
  apikey: { name: 'API Key', icon: '🔑' },
  'single-game': { name: 'Single Game', icon: '🎯' },
  'profile-picture': { name: 'Profile Picture', icon: '🖼️' },
  'back-button': { name: 'Back Button', icon: '⬅️' },
  'game-info': { name: 'Game Info', icon: 'ℹ️' },
  'game-description': { name: 'Game Description', icon: '📄' },
  'game-image': { name: 'Game Image', icon: '🖼️' },
  'game-details': { name: 'Game Details', icon: '📋' },
  'game-development-info': { name: 'Development Info', icon: '💻' },
  heartbeat: { name: 'my literal heartbeat', icon: '❤️' },
}

export const getWidgetDisplayName = (widgetType) => {
  return WIDGET_INFO[widgetType]?.name || widgetType
}

export const getWidgetIcon = (widgetType) => {
  return WIDGET_INFO[widgetType]?.icon || '📦'
}

