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

// Use Netlify function to proxy API calls (works in both dev and production)
const getApiUrl = (gameId) => {
  return `/api/games/${gameId}`;
};

/* eslint-disable react/prop-types */
export default function SingleGameWidget({ widgetId, wasLastInteractionDrag, onGameClick, widget }) {
  // Get gameId from widget settings, default to first game
  // Validate that the gameId exists in GAME_IDS, otherwise use default
  const getInitialGameId = () => {
    const settingsGameId = widget?.settings?.gameId;
    if (settingsGameId && GAME_IDS.includes(settingsGameId)) {
      return settingsGameId;
    }
    return GAME_IDS[0];
  };
  const [selectedGameId, setSelectedGameId] = useState(() => getInitialGameId());
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const [sizeClass, setSizeClass] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Update selectedGameId when widget settings change (only on mount or when settings actually change)
  useEffect(() => {
    const settingsGameId = widget?.settings?.gameId;
    // Validate that the gameId exists in GAME_IDS before using it
    if (settingsGameId && GAME_IDS.includes(settingsGameId)) {
      if (settingsGameId !== selectedGameId) {
        setSelectedGameId(settingsGameId);
      }
    } else if (!settingsGameId || !GAME_IDS.includes(settingsGameId)) {
      // If settings are missing or invalid, initialize with default
      // Only update if we don't already have a valid gameId set
      const defaultGameId = GAME_IDS[0];
      if (selectedGameId !== defaultGameId) {
        setSelectedGameId(defaultGameId);
        // Update widget settings if they're missing or invalid (only once on mount)
        if (widget?.onSettingsChange) {
          // Use a small delay to ensure the widget is fully mounted
          setTimeout(() => {
            widget.onSettingsChange({ gameId: defaultGameId });
          }, 0);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget?.settings?.gameId]); // Only depend on settings.gameId, not selectedGameId or onSettingsChange

  // Fetch game data when selectedGameId changes
  useEffect(() => {
    const fetchGame = async () => {
      if (!selectedGameId) return;
      
      try {
        setLoading(true);
        setError(null);
        const apiUrl = getApiUrl(selectedGameId);
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "omit",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch game: ${response.statusText}`);
        }

        const data = await response.json();
        setGame({
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
        });
      } catch (err) {
        console.error(`Error fetching game ${selectedGameId}:`, err);
        setError(err.message);
        setGame(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [selectedGameId]);

  // Update size class based on container dimensions
  useEffect(() => {
    const updateSizeClass = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const isNarrow = width < 200;
      const isShort = height < 150;
      const isVeryShort = height < 100;
      let classes = [];
      if (isNarrow) classes.push('narrow');
      if (isShort) classes.push('short');
      if (isVeryShort) classes.push('very-short');
      setSizeClass(classes.join(' '));
    };
    updateSizeClass();
    const resizeObserver = new ResizeObserver(updateSizeClass);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Handle game selection change
  const handleGameSelect = (gameId) => {
    setSelectedGameId(gameId);
    setIsDropdownOpen(false);
    
    // Update widget settings
    if (widget?.onSettingsChange) {
      widget.onSettingsChange({ gameId });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

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
        }}>Loading game...</div>
      </BaseWidget>
    );
  }

  if (error) {
    return (
      <BaseWidget padding="1rem 0.75rem 1rem 1rem">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          color: 'canvasText',
          opacity: 0.6,
          fontSize: '0.875rem',
          gap: '0.5rem'
        }}>
          <div>Error loading game</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{error}</div>
        </div>
      </BaseWidget>
    );
  }

  if (!game) {
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
        }}>No game selected</div>
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
      >
        {/* Game content */}
        <div 
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            cursor: 'pointer'
          }}
          onMouseUp={(e) => {
            // Only navigate if it wasn't a drag and not clicking on dropdown
            if (onGameClick && e.button === 0) {
              // Check if click was on dropdown or dropdown menu
              const clickedDropdown = e.target.closest('[data-dropdown-trigger]') || 
                                     e.target.closest('[data-dropdown-menu]');
              
              if (!clickedDropdown) {
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
            }
          }}
        >
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
              minWidth: 0,
              position: 'relative'
            }} ref={dropdownRef}>
              {/* Title as dropdown */}
              <div
                data-dropdown-trigger
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <h4 style={{
                  fontSize: sizeClass.includes('short') ? '1rem' : (sizeClass.includes('very-short') ? '0.9375rem' : '1.125rem'),
                  fontWeight: 600,
                  margin: sizeClass.includes('very-short') ? '0 0 0 0' : (sizeClass.includes('short') ? '0 0 0.25rem 0' : '0 0 0.375rem 0'),
                  color: 'canvasText',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{game.title}</h4>
                <span style={{
                  fontSize: sizeClass.includes('short') ? '0.625rem' : (sizeClass.includes('very-short') ? '0.5625rem' : '0.75rem'),
                  color: 'canvasText',
                  opacity: 0.5,
                  flexShrink: 0,
                  transition: 'transform 0.2s',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                  lineHeight: 1,
                  marginTop: '0.125rem'
                }}>▼</span>
              </div>
              
              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div 
                  data-dropdown-menu
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.25rem',
                    background: 'color-mix(in hsl, hsl(0 0% 4%), transparent 5%)',
                    border: '1px solid color-mix(in hsl, canvasText, transparent 10%)',
                    borderRadius: '4px',
                    boxShadow: '0 4px 12px color-mix(in hsl, canvasText, transparent 95%)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {GAME_IDS.map((gameId) => (
                    <div
                      key={gameId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGameSelect(gameId);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        color: 'canvasText',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        backgroundColor: selectedGameId === gameId 
                          ? 'color-mix(in hsl, canvasText, transparent 90%)' 
                          : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedGameId !== gameId) {
                          e.currentTarget.style.backgroundColor = 'color-mix(in hsl, canvasText, transparent 90%)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedGameId !== gameId) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {gameId.charAt(0).toUpperCase() + gameId.slice(1)}
                    </div>
                  ))}
                </div>
              )}
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
          
          {game.image && (
            <div style={{
              position: 'relative',
              width: '100%',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              borderRadius: '4px',
              background: 'color-mix(in hsl, canvasText, transparent 98%)'
            }}
            >
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
                  e.target.src = "https://via.placeholder.com/800x600?text=Game+Image";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            </div>
          )}
          
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
    </BaseWidget>
  );
}

