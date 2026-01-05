const WIDGET_META = {
  profile: { name: 'Profile', icon: '👤' },
  about: { name: 'About', icon: 'ℹ️' },
  skills: { name: 'Skills', icon: '🧠' },
  contact: { name: 'Contact', icon: '✉️' },
  games: { name: 'Games', icon: '🎮' },
  visitors: { name: 'Visitors', icon: '👀' },
  motd: { name: 'Message of the Day', icon: '💬' },
  time: { name: 'Time', icon: '⏰' },
  github: { name: 'GitHub Activity', icon: '🐙' },
  apikey: { name: 'API Key', icon: '🔑' },
  'single-game': { name: 'Single Game', icon: '🕹️' },
  'profile-picture': { name: 'Profile Picture', icon: '🖼️' },
  'back-button': { name: 'Back Button', icon: '↩️' },
  'game-info': { name: 'Game Info', icon: '📌' },
  'game-description': { name: 'Game Description', icon: '📝' },
  'game-image': { name: 'Game Image', icon: '🖼️' },
  'game-details': { name: 'Game Details', icon: '📋' },
  'game-development-info': { name: 'Development Info', icon: '🧩' },
  heartbeat: { name: 'Heartbeat', icon: '❤️' },
}

const titleCase = (value) => {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export const getWidgetMeta = (widgetType, component) => {
  const fallback = WIDGET_META[widgetType] || {}
  const meta = component?.widgetMeta || {}
  const name = meta.name || fallback.name || component?.displayName || component?.name || titleCase(widgetType)
  const icon = meta.icon || fallback.icon || component?.icon || '??'

  return { name, icon }
}
