import { useState, useEffect, useRef } from "react";
import BaseWidget from "./BaseWidget";
import "./Widget.css";

const GAME_IDS = [
  "pullbackracers",
  "bubbledome",
  "gamblelite",
  "gp1",
  "Forgekeepers",
  "GFOS1992",
];

// Use proxy in development, direct API in production
const getApiUrl = (gameId) => {
  // In development, use Vite proxy to avoid CORS issues
  if (import.meta.env.DEV) {
    return `/api/games/${gameId}`;
  }
  // In production, try direct API (assumes server has CORS headers)
  // If CORS fails, you may need to use a CORS proxy service
  return `https://api.diabolical.studio/rest-api/games/${gameId}`;
};

export default function GamesWidget() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(null);

  // Fetch games from API
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const gamePromises = GAME_IDS.map(async (gameId) => {
          try {
            const apiUrl = getApiUrl(gameId);
            const response = await fetch(apiUrl, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              // Don't send credentials to avoid CORS preflight issues
              credentials: "omit",
            });

            if (!response.ok) {
              console.warn(
                `Failed to fetch game ${gameId}:`,
                response.statusText
              );
              return null;
            }

            const data = await response.json();
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
            };
          } catch (error) {
            // Handle CORS and network errors
            if (error.name === "TypeError" && error.message.includes("fetch")) {
              console.error(
                `Network/CORS error fetching game ${gameId}:`,
                error.message
              );
            } else {
              console.error(`Error fetching game ${gameId}:`, error);
            }
            return null;
          }
        });

        const fetchedGames = (await Promise.all(gamePromises)).filter(
          (game) => game !== null
        );
        setGames(fetchedGames);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || games.length === 0) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 4000); // Change every 4 seconds

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, games.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % games.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + games.length) % games.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (loading) {
    return (
      <BaseWidget className="widget-games" padding="1rem 0.75rem 1rem 1rem">
        <div className="games-loading">Loading games...</div>
      </BaseWidget>
    );
  }

  if (games.length === 0) {
    return (
      <BaseWidget className="widget-games" padding="1rem 0.75rem 1rem 1rem">
        <div className="games-error">No games available</div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget
      className="widget-games"
      padding="1rem 0.75rem 1rem 1rem"
      style={{ gap: "0.75rem" }}
    >
      <div 
        className="games-carousel"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div className="carousel-container">
          {games.map((game, index) => (
            <div
              key={game.id}
              className={`carousel-slide ${
                index === currentIndex ? "active" : ""
              }`}
            >
              <div className="game-card">
                <div className="game-header">
                  <div className="game-header-content">
                    <h4 className="game-title">{game.title}</h4>
                    <div className="game-team">
                      {game.teamIcon && (
                        <img
                          src={game.teamIcon}
                          alt={game.tech}
                          className="game-team-icon"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <span className="game-team-name">{game.tech}</span>
                    </div>
                  </div>
                </div>
                <div className="game-image-container">
                  <img 
                    src={game.image} 
                    alt={game.title}
                    className="game-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/800x600?text=Game+Image";
                    }}
                  />
                </div>
                <div className="game-info">
                  <p className="game-description">{game.description}</p>
                  {game.version && (
                    <div className="game-details">
                      <div className="game-detail-item">
                        <span className="game-detail-label">Version:</span>
                        <span className="game-detail-value">{game.version}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="carousel-controls">
          <button 
            className="carousel-btn prev" 
            onClick={goToPrev}
            aria-label="Previous game"
          >
            ‹
          </button>
          <div className="carousel-dots">
            {games.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${
                  index === currentIndex ? "active" : ""
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to game ${index + 1}`}
              />
            ))}
          </div>
          <button 
            className="carousel-btn next" 
            onClick={goToNext}
            aria-label="Next game"
          >
            ›
          </button>
        </div>
      </div>
    </BaseWidget>
  );
}
