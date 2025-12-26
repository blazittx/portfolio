import { useState, useEffect, useRef, useMemo } from "react";
import BaseWidget from "./BaseWidget";

const GAME_IDS = [
  "pullbackracers",
  "bubbledome",
  "gamblelite",
  "gp1",
  "Forgekeepers",
  "GFOS1992",
];

// Use Netlify function to proxy API calls (works in both dev and production)
// In development, Vite proxy handles /api routes
// In production, Netlify redirects /api/games/* to the function
const getApiUrl = (gameId) => {
    return `/api/games/${gameId}`;
};

/* eslint-disable react/prop-types */
export default function GamesWidget({ widgetId, wasLastInteractionDrag, onGameClick, allWidgets = [] }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(null);
  const containerRef = useRef(null);
  const [sizeClass, setSizeClass] = useState('');
  const fetchedGameIdsRef = useRef(null); // Track which gameIds we've already fetched
  const [imageIndices, setImageIndices] = useState({}); // Track current image index for each game
  const [shouldSwitchImage, setShouldSwitchImage] = useState(true); // Track whether to switch image or game

  // Create a stable key from allWidgets that only changes when relevant data changes
  const allWidgetsKey = useMemo(() => {
    if (!Array.isArray(allWidgets)) return '';
    return allWidgets
      .map(w => `${w.id}-${w.type}-${w.settings?.gameId || ''}`)
      .sort()
      .join('|');
  }, [allWidgets]);

  // Memoize the list of game IDs from single-game widgets to prevent unnecessary re-fetches
  // Only recalculate when the actual gameIds change, not when the array reference changes
  const singleGameWidgetGameIdsString = useMemo(() => {
    if (!Array.isArray(allWidgets)) return '';
    const gameIds = allWidgets
      .filter(widget => widget.type === 'single-game' && widget.settings?.gameId)
      .map(widget => widget.settings.gameId)
      .filter(gameId => GAME_IDS.includes(gameId)) // Only include valid game IDs
      .sort(); // Sort for consistent comparison
    return gameIds.join(',');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWidgetsKey]); // Intentionally depend on stable key, not allWidgets array

  // Memoize the gameIds to fetch
  const gameIdsToFetch = useMemo(() => {
    const excludedIds = singleGameWidgetGameIdsString ? singleGameWidgetGameIdsString.split(',') : [];
    return GAME_IDS.filter(gameId => !excludedIds.includes(gameId)).sort();
  }, [singleGameWidgetGameIdsString]);

  // Create a stable string key for the gameIds to fetch
  const gameIdsToFetchKey = gameIdsToFetch.join(',');

  // Fetch games from API - only when gameIdsToFetch actually changes
  useEffect(() => {
    const fetchGames = async () => {
      // Skip if we've already fetched these exact gameIds
      if (fetchedGameIdsRef.current === gameIdsToFetchKey) {
        if (loading) {
          setLoading(false);
        }
        return;
      }

      // Skip if no games to fetch
      if (gameIdsToFetch.length === 0) {
        setGames([]);
        setLoading(false);
        fetchedGameIdsRef.current = '';
        return;
      }

      try {
        setLoading(true);
        fetchedGameIdsRef.current = gameIdsToFetchKey; // Mark as fetching
        
        const gamePromises = gameIdsToFetch.map(async (gameId) => {
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
        fetchedGameIdsRef.current = gameIdsToFetchKey; // Mark as successfully fetched
      } catch (error) {
        console.error("Error fetching games:", error);
        fetchedGameIdsRef.current = null; // Reset on error so we can retry
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameIdsToFetchKey]); // Only depend on the stable string key, not array references

  useEffect(() => {
    if (!isAutoPlaying || games.length === 0) return;

    autoPlayRef.current = setInterval(() => {
      if (shouldSwitchImage) {
        // Switch to next image for current game
        const currentGame = games[currentIndex];
        if (currentGame) {
          const images = [currentGame.image, currentGame.image, currentGame.image, currentGame.image, currentGame.image];
          const currentImageIndex = imageIndices[currentGame.id] || 0;
          const nextImageIndex = (currentImageIndex + 1) % images.length;
          setImageIndices(prev => ({ ...prev, [currentGame.id]: nextImageIndex }));
        }
        setShouldSwitchImage(false); // Next time, switch game
      } else {
        // Switch to next game
        setCurrentIndex((prev) => (prev + 1) % games.length);
        setShouldSwitchImage(true); // Next time, switch image
      }
    }, 3000); // Change every 3 seconds

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, games, currentIndex, shouldSwitchImage, imageIndices]);

  // Initialize image indices for each game
  useEffect(() => {
    if (games.length === 0) return;
    
    setImageIndices(prev => {
      const newIndices = { ...prev };
      let hasNew = false;
      games.forEach(game => {
        if (!(game.id in newIndices)) {
          newIndices[game.id] = 0;
          hasNew = true;
        }
      });
      return hasNew ? newIndices : prev;
    });
  }, [games]);

  // Remove the per-game auto-scroll since we're handling it in the main auto-play loop

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
                    // Check if click was on thumbnail container
                    const clickedThumbnail = e.target.closest('[data-thumbnail-container]');
                    if (clickedThumbnail) return;
                    
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
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginBottom: sizeClass.includes('very-short') ? '0' : (sizeClass.includes('short') ? '0.25rem' : '0.375rem')
                      }}>
                        <h4 style={{
                          fontSize: sizeClass.includes('short') ? '1rem' : (sizeClass.includes('very-short') ? '0.9375rem' : '1.125rem'),
                          fontWeight: 600,
                          margin: 0,
                          color: 'canvasText',
                          letterSpacing: '-0.01em',
                          lineHeight: 1.3,
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{game.title}</h4>
                        {/* Unity and C# chips */}
                        <div style={{
                          display: sizeClass.includes('very-short') ? 'none' : 'flex',
                          flexWrap: 'wrap',
                          gap: '0.375rem',
                          alignItems: 'center',
                          flexShrink: 0
                        }}>
                          {/* Unity chip */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: sizeClass.includes('short') ? '0.1875rem 0.375rem' : '0.25rem 0.5rem',
                            borderRadius: '2px',
                            background: 'color-mix(in hsl, canvasText, transparent 90%)',
                            border: '1px solid color-mix(in hsl, canvasText, transparent 20%)',
                            fontSize: sizeClass.includes('short') ? '0.625rem' : '0.6875rem',
                            fontWeight: 500,
                            color: 'canvasText',
                            opacity: 0.9,
                            whiteSpace: 'nowrap',
                            userSelect: 'none'
                          }}>
                            Unity
                          </div>
                          {/* C# chip */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: sizeClass.includes('short') ? '0.1875rem 0.375rem' : '0.25rem 0.5rem',
                            borderRadius: '2px',
                            background: 'color-mix(in hsl, canvasText, transparent 90%)',
                            border: '1px solid color-mix(in hsl, canvasText, transparent 20%)',
                            fontSize: sizeClass.includes('short') ? '0.625rem' : '0.6875rem',
                            fontWeight: 500,
                            color: 'canvasText',
                            opacity: 0.9,
                            whiteSpace: 'nowrap',
                            userSelect: 'none'
                          }}>
                            C#
                          </div>
                        </div>
                      </div>
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
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    flex: 1,
                    minHeight: 0,
                    position: 'relative'
                  }}
                  >
                    {/* Large image on top */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      flex: 1,
                      minHeight: 0,
                      overflow: 'hidden',
                      borderRadius: '4px',
                      background: 'color-mix(in hsl, canvasText, transparent 98%)'
                    }}>
                      {(() => {
                        const images = [game.image, game.image, game.image, game.image, game.image];
                        const currentImageIndex = imageIndices[game.id] || 0;
                        return (
                          <img 
                            src={images[currentImageIndex]} 
                            alt={`${game.title} - Image ${currentImageIndex + 1}`}
                            draggable="false"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              userSelect: 'none',
                              transition: 'opacity 0.3s ease'
                            }}
                            loading="lazy"
                            onDragStart={(e) => e.preventDefault()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/800x600?text=Game+Image";
                            }}
                          />
                        );
                      })()}
                    </div>

                    {/* Thumbnail images below, horizontally */}
                    <div 
                      data-thumbnail-container
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '0.5rem',
                        overflowX: 'hidden',
                        overflowY: 'hidden',
                        paddingBottom: '0.25rem',
                        flexShrink: 0,
                        flexWrap: 'wrap',
                        justifyContent: 'flex-start',
                        // Prevent page scrolling when clicking thumbnails on mobile
                        touchAction: 'pan-y',
                        WebkitOverflowScrolling: 'touch'
                      }}
                    >
                      {(() => {
                        const images = [game.image, game.image, game.image, game.image, game.image];
                        const currentImageIndex = imageIndices[game.id] || 0;
                        return images.map((image, index) => (
                          <div
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setImageIndices(prev => ({ ...prev, [game.id]: index }));
                            }}
                            onMouseUp={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onTouchStart={(e) => {
                              // Prevent page scrolling when touching thumbnails on mobile
                              e.stopPropagation();
                            }}
                            style={{
                              position: 'relative',
                              width: '60px',
                              height: '60px',
                              flexShrink: 0,
                              borderRadius: '4px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: currentImageIndex === index 
                                ? '2px solid canvasText' 
                                : '2px solid transparent',
                              opacity: currentImageIndex === index ? 1 : 0.7,
                              transition: 'opacity 0.2s ease, border-color 0.2s ease',
                              background: 'color-mix(in hsl, canvasText, transparent 98%)'
                            }}
                            onMouseEnter={(e) => {
                              if (currentImageIndex !== index) {
                                e.currentTarget.style.opacity = '0.9'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (currentImageIndex !== index) {
                                e.currentTarget.style.opacity = '0.7'
                              }
                            }}
                          >
                            <img 
                              src={image} 
                              alt={`${game.title} - Thumbnail ${index + 1}`}
                              draggable="false"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                userSelect: 'none'
                              }}
                              loading="lazy"
                              onDragStart={(e) => e.preventDefault()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/60x60?text=Image";
                              }}
                            />
                          </div>
                        ));
                      })()}
                    </div>
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
