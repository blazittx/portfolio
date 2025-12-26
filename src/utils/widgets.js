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
}

export const getWidgetDisplayName = (widgetType) => {
  return WIDGET_INFO[widgetType]?.name || widgetType
}

export const getWidgetIcon = (widgetType) => {
  return WIDGET_INFO[widgetType]?.icon || '📦'
}

