import './GameDetail.css'

function GameDetail({ game, onBack }) {
  if (!game) return null

  return (
    <div className="game-detail">
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>
      
      <div className="game-detail-header">
        {game.background_image_url && (
          <div className="game-detail-image">
            <img src={game.background_image_url} alt={game.game_name} />
          </div>
        )}
        <div className="game-detail-info">
          <h1>{game.game_name}</h1>
          {game.version && <span className="game-version">v{game.version}</span>}
          {game.status && (
            <span className={`game-status game-status-${game.status}`}>
              {game.status}
            </span>
          )}
        </div>
      </div>

      {game.description && (
        <div className="game-detail-section">
          <h2>Description</h2>
          <p>{game.description}</p>
        </div>
      )}

      <div className="game-detail-meta">
        {game.github_repo && (
          <div className="meta-item">
            <span className="meta-label">Repository</span>
            <a
              href={`https://github.com/${game.github_repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="meta-link"
            >
              {game.github_repo}
            </a>
          </div>
        )}
        
        {game.difficulty_level && (
          <div className="meta-item">
            <span className="meta-label">Difficulty</span>
            <span className="meta-value">{game.difficulty_level}</span>
          </div>
        )}

        {game.min_players && game.max_players && (
          <div className="meta-item">
            <span className="meta-label">Players</span>
            <span className="meta-value">
              {game.min_players === game.max_players
                ? game.min_players
                : `${game.min_players}-${game.max_players}`}
            </span>
          </div>
        )}

        {game.updated_at && (
          <div className="meta-item">
            <span className="meta-label">Last Updated</span>
            <span className="meta-value">
              {new Date(game.updated_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameDetail



