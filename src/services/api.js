// Use proxy in development, direct API in production
const API_BASE = import.meta.env.DEV 
  ? '/api' 
  : 'https://api.diabolical.studio/rest-api'

export const fetchGames = async (teamName = 'Diabolical Studios') => {
  try {
    const encodedTeamName = encodeURIComponent(teamName)
    const url = `${API_BASE}/games/team/${encodedTeamName}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching games:', error)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach the API. Check your connection or CORS settings.')
    }
    throw error
  }
}

