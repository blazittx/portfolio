import { useState, useEffect } from 'react'
import { fetchGames } from '../services/api'
import GameCard from './GameCard'
import './GamesList.css'

function GamesList({ onGameSelect }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true)
        const data = await fetchGames()
        setGames(data)
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('Failed to load games:', err)
      } finally {
        setLoading(false)
      }
    }

    loadGames()
  }, [])

  if (loading) {
    return (
      <div className="games-list">
        <div className="loading">Loading games...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="games-list">
        <div className="error">Error loading games: {error}</div>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="games-list">
        <div className="empty">No games found</div>
      </div>
    )
  }

  // Filter to show public games by default, or all if needed
  const publicGames = games.filter(game => game.status === 'public')

  return (
    <div className="games-list">
      <div className="games-header">
        <h1>Games</h1>
      </div>
      <div className="games-grid">
        {publicGames.map((game) => (
          <GameCard
            key={game.game_id}
            game={game}
            onClick={() => onGameSelect(game)}
          />
        ))}
      </div>
    </div>
  )
}

export default GamesList
