import { useState, useEffect, useRef } from "react";
import BaseWidget from "./BaseWidget";

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

/* eslint-disable react/prop-types */
export default function GamesWidget({ widgetId, wasLastInteractionDrag, onGameClick }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(null);
  const containerRef = useRef(null);
  const [sizeClass, setSizeClass] = useState('');

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

  useEffect(() => {
    const updateSizeClass = () => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const isNarrow = width < 200
      const isShort = height < 150
      const isVeryShort = height < 100
      let classes = []
      if (isNarrow) classes.push('narrow')
      if (isShort) classes.push('short')
      if (isVeryShort) classes.push('very-short')
      setSizeClass(classes.join(' '))
    }
    updateSizeClass()
    const resizeObserver = new ResizeObserver(updateSizeClass)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [])

  // Add fadeInUp animation
  useEffect(() => {
    if (!document.getElementById('games-widget-animation')) {
      const style = document.createElement('style')
      style.id = 'games-widget-animation'
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

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
      <BaseWidget padding="1rem 0.75rem 1rem 1rem">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          color: 'canvasText',
          opacity: 0.6,
          fontSize: '0.875rem'
        }}>Loading games...</div>
      </BaseWidget>
    );
  }

  if (games.length === 0) {
    return (
      <BaseWidget padding="1rem 0.75rem 1rem 1rem">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          color: 'canvasText',
          opacity: 0.6,
          fontSize: '0.875rem'
        }}>No games available</div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget
      padding="1rem 0.75rem 1rem 1rem"
      style={{ gap: "0.75rem" }}
    >
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {games.map((game, index) => {
            const isActive = index === currentIndex
            return (
              <div
                key={game.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'translateX(0)' : 'translateX(20px)',
                  transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: isActive ? 'all' : 'none',
                  cursor: 'pointer'
                }}
                onMouseUp={(e) => {
                  // Only navigate if it wasn't a drag (check after mouse up)
                  if (onGameClick && e.button === 0) {
                    // Small delay to let drag system update
                    setTimeout(() => {
                      const wasDrag = wasLastInteractionDrag && typeof wasLastInteractionDrag === 'function' 
                        ? wasLastInteractionDrag(widgetId) 
                        : false
                      
                      if (!wasDrag) {
                        onGameClick(game)
                      }
                    }, 10)
                  }
                }}
              >
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  padding: 0,
                  animation: 'fadeInUp 0.6s ease-out'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    flexShrink: 0,
                    flexDirection: sizeClass.includes('narrow') ? 'column' : 'row'
                  }}>
                    <div style={{
                      flex: 1,
                      minWidth: 0
                    }}>
                      <h4 style={{
                        fontSize: sizeClass.includes('short') ? '1rem' : (sizeClass.includes('very-short') ? '0.9375rem' : '1.125rem'),
                        fontWeight: 600,
                        margin: sizeClass.includes('very-short') ? '0 0 0 0' : (sizeClass.includes('short') ? '0 0 0.25rem 0' : '0 0 0.375rem 0'),
                        color: 'canvasText',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.3
                      }}>{game.title}</h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        opacity: 0.7,
                        color: 'canvasText'
                      }}>
                        {game.teamIcon && (
                          <img
                            src={game.teamIcon}
                            alt={game.tech}
                            draggable="false"
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '2px',
                              objectFit: 'cover',
                              flexShrink: 0,
                              userSelect: 'none'
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{game.tech}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    borderRadius: '4px',
                    background: 'color-mix(in hsl, canvasText, transparent 98%)'
                  }}>
                    <img 
                      src={game.image} 
                      alt={game.title}
                      draggable="false"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        userSelect: 'none'
                      }}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/800x600?text=Game+Image";
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                    flexShrink: 0
                  }}>
                    <p style={{
                      fontSize: sizeClass.includes('short') ? '0.75rem' : '0.8125rem',
                      lineHeight: 1.5,
                      opacity: 0.85,
                      color: 'canvasText',
                      margin: 0,
                      display: sizeClass.includes('very-short') ? 'none' : (sizeClass.includes('short') ? '-webkit-box' : '-webkit-box'),
                      WebkitLineClamp: sizeClass.includes('short') ? 1 : 2,
                      lineClamp: sizeClass.includes('short') ? 1 : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>{game.description}</p>
                    {game.version && (
                      <div style={{
                        display: sizeClass.includes('very-short') ? 'none' : 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        paddingTop: sizeClass.includes('short') ? '0.375rem' : '0.5rem',
                        borderTop: '1px solid color-mix(in hsl, canvasText, transparent 4%)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          fontSize: '0.75rem'
                        }}>
                          <span style={{
                            opacity: 0.6,
                            color: 'canvasText'
                          }}>Version:</span>
                          <span style={{
                            opacity: 0.9,
                            color: 'canvasText',
                            fontWeight: 500
                          }}>{game.version}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          marginTop: 'auto',
          flexShrink: 0,
          flexWrap: sizeClass.includes('narrow') ? 'wrap' : 'nowrap',
          gap: sizeClass.includes('narrow') ? '0.25rem' : '0.5rem'
        }}>
          <button 
            style={{
              background: 'color-mix(in hsl, canvasText, transparent 95%)',
              border: '1px solid color-mix(in hsl, canvasText, transparent 6%)',
              borderRadius: '4px',
              color: 'canvasText',
              fontSize: sizeClass.includes('narrow') ? '1rem' : '1.25rem',
              width: sizeClass.includes('narrow') ? '1.75rem' : '2rem',
              height: sizeClass.includes('narrow') ? '1.75rem' : '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 0.6,
              transition: 'opacity 0.2s, transform 0.2s',
              padding: 0,
              lineHeight: 1
            }}
            onClick={goToPrev}
            aria-label="Previous game"
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
          >
            ‹
          </button>
          <div style={{
            display: 'flex',
            gap: '0.375rem',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center'
          }}>
            {games.map((_, index) => {
              const isActive = index === currentIndex
              return (
                <button
                  key={index}
                  style={{
                    width: isActive ? '8px' : '6px',
                    height: isActive ? '8px' : '6px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isActive ? 'canvasText' : 'color-mix(in hsl, canvasText, transparent 80%)',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.3s ease',
                    opacity: isActive ? 0.8 : 0.4,
                    transform: isActive ? 'scale(1.2)' : 'scale(1)'
                  }}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to game ${index + 1}`}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.opacity = '0.7'
                      e.currentTarget.style.transform = 'scale(1.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.opacity = '0.4'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                />
              )
            })}
          </div>
          <button 
            style={{
              background: 'color-mix(in hsl, canvasText, transparent 95%)',
              border: '1px solid color-mix(in hsl, canvasText, transparent 6%)',
              borderRadius: '4px',
              color: 'canvasText',
              fontSize: sizeClass.includes('narrow') ? '1rem' : '1.25rem',
              width: sizeClass.includes('narrow') ? '1.75rem' : '2rem',
              height: sizeClass.includes('narrow') ? '1.75rem' : '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 0.6,
              transition: 'opacity 0.2s, transform 0.2s',
              padding: 0,
              lineHeight: 1
            }}
            onClick={goToNext}
            aria-label="Next game"
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
          >
            ›
          </button>
        </div>
      </div>
    </BaseWidget>
  );
}
