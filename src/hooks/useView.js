import { useState, useEffect } from 'react'

// Fetch game data by ID
// Uses Netlify function to proxy API calls (works in both dev and production)
const fetchGameById = async (gameId) => {
  const getApiUrl = (id) => {
    return `/api/games/${id}`
  }

  try {
    const apiUrl = getApiUrl(gameId)
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'omit',
    })

    if (!response.ok) {
      console.warn(`Failed to fetch game ${gameId}:`, response.statusText)
      return null
    }

    const data = await response.json()
    return {
      id: data.game_id,
      title: data.game_name,
      description: data.description,
      year: new Date(data.created_at).getFullYear().toString(),
      tech: data.team_name,
      image: data.background_image_url,
      teamIcon: data.team_icon_url,
      version: data.version,
      githubRepo: data.github_repo,
      difficulty: data.difficulty_level,
      minPlayers: data.min_players,
      maxPlayers: data.max_players,
    }
  } catch (error) {
    console.error(`Error fetching game ${gameId}:`, error)
    return null
  }
}

export const useView = () => {
  const [currentView, setCurrentView] = useState('main') // 'main' or 'game-detail'
  const [selectedGame, setSelectedGame] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize from URL on mount
  useEffect(() => {
    const path = window.location.pathname
    const gameId = path.slice(1) // Remove leading '/'

    // If there's a game ID in the URL and we're not already showing it
    if (gameId && gameId !== '' && currentView === 'main' && !selectedGame) {
      setIsLoading(true)
      fetchGameById(gameId)
        .then((game) => {
          if (game) {
            setSelectedGame(game)
            setCurrentView('game-detail')
          } else {
            // Game not found, redirect to main
            window.history.replaceState(null, '', '/')
          }
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
          window.history.replaceState(null, '', '/')
        })
    } else if (!gameId || gameId === '') {
      // URL is root, ensure we're on main view
      if (currentView !== 'main') {
        setCurrentView('main')
        setSelectedGame(null)
      }
    }
  }, []) // Only run on mount

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      const gameId = path.slice(1)

      if (gameId && gameId !== '') {
        setIsLoading(true)
        fetchGameById(gameId)
          .then((game) => {
            if (game) {
              setSelectedGame(game)
              setCurrentView('game-detail')
            } else {
              setCurrentView('main')
              setSelectedGame(null)
            }
            setIsLoading(false)
          })
          .catch(() => {
            setCurrentView('main')
            setSelectedGame(null)
            setIsLoading(false)
          })
      } else {
        setCurrentView('main')
        setSelectedGame(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToGameDetail = (game) => {
    setSelectedGame(game)
    setCurrentView('game-detail')
    // Update URL to /gameId
    window.history.pushState(null, '', `/${game.id}`)
  }

  const navigateToMain = () => {
    setCurrentView('main')
    setSelectedGame(null)
    // Update URL to root
    window.history.pushState(null, '', '/')
  }

  return {
    currentView,
    selectedGame,
    navigateToGameDetail,
    navigateToMain,
    isLoading
  }
}

