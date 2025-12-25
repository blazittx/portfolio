import './GameCard.css'

function GameCard({ game, onClick }) {
  return (
    <div className="game-card" onClick={onClick}>
      <div className="game-image-container">
        {game.background_image_url ? (
          <img
            src={game.background_image_url}
            alt={game.game_name}
            className="game-image"
          />
        ) : (
          <div className="game-image-placeholder">
            <span>{game.game_name?.[0] || 'G'}</span>
          </div>
        )}
        {game.status && (
          <span className={`game-status game-status-${game.status}`}>
            {game.status}
          </span>
        )}
      </div>
      <div className="game-info">
        <h3 className="game-title">{game.game_name}</h3>
        {game.description && (
          <p className="game-description">
            {game.description.length > 120
              ? `${game.description.substring(0, 120)}...`
              : game.description}
          </p>
        )}
        {game.version && (
          <span className="game-version">v{game.version}</span>
        )}
      </div>
    </div>
  )
}

export default GameCard



