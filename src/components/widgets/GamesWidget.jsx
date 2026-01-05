import { useState, useEffect, useRef, useMemo } from "react";
import BaseWidget from "./BaseWidget";
import {
  GAME_IDS,
  YOUTUBE_URLS,
  getGameChips,
  getGameLinks,
} from "../../constants/games";
import { isYouTubeUrl } from "../../utils/youtube";
import MediaCarousel from "./MediaCarousel";
import { isMobile } from "../../utils/mobile";

// Use Netlify function to proxy API calls (works in both dev and production)
// In development, Vite proxy handles /api routes
// In production, Netlify redirects /api/games/* to the function
const getApiUrl = (gameId) => {
  return `/api/games/${gameId}`;
};

/* eslint-disable react/prop-types */
export default function GamesWidget({
  widgetId,
  wasLastInteractionDrag,
  onGameClick,
  allWidgets = [],
}) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(null);
  const containerRef = useRef(null);
  const [sizeClass, setSizeClass] = useState("");
  const fetchedGameIdsRef = useRef(null); // Track which gameIds we've already fetched
  const [imageIndices, setImageIndices] = useState({}); // Track current image index for each game
  const [shouldSwitchImage, setShouldSwitchImage] = useState(true); // Track whether to switch image or game
  const imageHoldMs = 3000;
  const videoHoldMs = 8000;

  // Create a stable key from allWidgets that only changes when relevant data changes
  const allWidgetsKey = useMemo(() => {
    if (!Array.isArray(allWidgets)) return "";
    return allWidgets
      .map((w) => `${w.id}-${w.type}-${w.settings?.gameId || ""}`)
      .sort()
      .join("|");
  }, [allWidgets]);

  // Memoize the list of game IDs from single-game widgets to prevent unnecessary re-fetches
  // Only recalculate when the actual gameIds change, not when the array reference changes
  const singleGameWidgetGameIdsString = useMemo(() => {
    if (!Array.isArray(allWidgets)) return "";
    const gameIds = allWidgets
      .filter(
        (widget) => widget.type === "single-game" && widget.settings?.gameId
      )
      .map((widget) => widget.settings.gameId)
      .filter((gameId) => GAME_IDS.includes(gameId)) // Only include valid game IDs
      .sort(); // Sort for consistent comparison
    return gameIds.join(",");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWidgetsKey]); // Intentionally depend on stable key, not allWidgets array

  // Memoize the gameIds to fetch
  const gameIdsToFetch = useMemo(() => {
    const excludedIds = singleGameWidgetGameIdsString
      ? singleGameWidgetGameIdsString.split(",")
      : [];
    return GAME_IDS.filter((gameId) => !excludedIds.includes(gameId)).sort();
  }, [singleGameWidgetGameIdsString]);

  // Create a stable string key for the gameIds to fetch
  const gameIdsToFetchKey = gameIdsToFetch.join(",");

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
        fetchedGameIdsRef.current = "";
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
            // Get video URL from manual mapping first, then fall back to API data
            const videoUrl =
              YOUTUBE_URLS[gameId] ||
              data.youtube_url ||
              data.video_url ||
              data.trailer_url ||
              null;
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
              videoUrl: videoUrl,
              screenshots: data.screenshots || [],
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

  // Build media array for a game: video first (if present), then screenshots, then fallback to background image
  const getMediaArray = (game) => {
    if (!game) return [];
    const media = [];
    // Add video as first item if present
    if (game.videoUrl && isYouTubeUrl(game.videoUrl)) {
      media.push({ type: "video", url: game.videoUrl });
    }
    // Add screenshots if available
    if (
      game.screenshots &&
      Array.isArray(game.screenshots) &&
      game.screenshots.length > 0
    ) {
      game.screenshots.forEach((screenshotUrl) => {
        media.push({ type: "image", url: screenshotUrl });
      });
    } else if (game.image) {
      // Fallback to background image if no screenshots
      media.push({ type: "image", url: game.image });
    }
    return media;
  };

  useEffect(() => {
    if (!isAutoPlaying || games.length === 0) return;

    const currentMedia = (() => {
      const currentGame = games[currentIndex];
      if (!currentGame) return null;
      const mediaArray = getMediaArray(currentGame);
      const currentImageIndex = imageIndices[currentGame.id] || 0;
      return mediaArray[currentImageIndex] || null;
    })();

    const delay =
      currentMedia && currentMedia.type === "video"
        ? videoHoldMs
        : imageHoldMs;

    autoPlayRef.current = setTimeout(() => {
      if (shouldSwitchImage) {
        // Switch to next image for current game
        const currentGame = games[currentIndex];
        if (currentGame) {
          const mediaArray = getMediaArray(currentGame);
          if (mediaArray.length === 0) {
            return;
          }
          const currentImageIndex = imageIndices[currentGame.id] || 0;
          const nextImageIndex = (currentImageIndex + 1) % mediaArray.length;
          setImageIndices((prev) => ({
            ...prev,
            [currentGame.id]: nextImageIndex,
          }));
        }
        setShouldSwitchImage(false); // Next time, switch game
      } else {
        // Switch to next game
        setCurrentIndex((prev) => (prev + 1) % games.length);
        setShouldSwitchImage(true); // Next time, switch image
      }
    }, delay); // Variable delay based on media type

    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, games, currentIndex, shouldSwitchImage, imageIndices]);

  // Initialize image indices for each game
  useEffect(() => {
    if (games.length === 0) return;

    setImageIndices((prev) => {
      const newIndices = { ...prev };
      let hasNew = false;
      games.forEach((game) => {
        if (!(game.id in newIndices)) {
          const mediaArray = getMediaArray(game);
          const videoIndex = mediaArray.findIndex(
            (item) => item.type === "video"
          );
          newIndices[game.id] = videoIndex >= 0 ? videoIndex : 0;
          hasNew = true;
        }
      });
      return hasNew ? newIndices : prev;
    });
  }, [games]);

  // Remove the per-game auto-scroll since we're handling it in the main auto-play loop

  useEffect(() => {
    const updateSizeClass = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const isNarrow = width < 200;
      const isShort = height < 150;
      const isVeryShort = height < 100;
      let classes = [];
      if (isNarrow) classes.push("narrow");
      if (isShort) classes.push("short");
      if (isVeryShort) classes.push("very-short");
      setSizeClass(classes.join(" "));
    };
    updateSizeClass();
    const resizeObserver = new ResizeObserver(updateSizeClass);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Add fadeInUp animation
  useEffect(() => {
    if (!document.getElementById("games-widget-animation")) {
      const style = document.createElement("style");
      style.id = "games-widget-animation";
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
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Helper function to render Steam icon SVG
  const renderSteamIcon = (size) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      style={{
        display: "block",
        flexShrink: 0,
        opacity: 0.9,
      }}
    >
      <path d="M18.102 12.129c0-0 0-0 0-0.001 0-1.564 1.268-2.831 2.831-2.831s2.831 1.268 2.831 2.831c0 1.564-1.267 2.831-2.831 2.831-0 0-0 0-0.001 0h0c-0 0-0 0-0.001 0-1.563 0-2.83-1.267-2.83-2.83 0-0 0-0 0-0.001v0zM24.691 12.135c0-2.081-1.687-3.768-3.768-3.768s-3.768 1.687-3.768 3.768c0 2.081 1.687 3.768 3.768 3.768v0c2.080-0.003 3.765-1.688 3.768-3.767v-0zM10.427 23.76l-1.841-0.762c0.524 1.078 1.611 1.808 2.868 1.808 1.317 0 2.448-0.801 2.93-1.943l0.008-0.021c0.155-0.362 0.246-0.784 0.246-1.226 0-1.757-1.424-3.181-3.181-3.181-0.405 0-0.792 0.076-1.148 0.213l0.022-0.007 1.903 0.787c0.852 0.364 1.439 1.196 1.439 2.164 0 1.296-1.051 2.347-2.347 2.347-0.324 0-0.632-0.066-0.913-0.184l0.015 0.006zM15.974 1.004c-7.857 0.001-14.301 6.046-14.938 13.738l-0.004 0.054 8.038 3.322c0.668-0.462 1.495-0.737 2.387-0.737 0.001 0 0.002 0 0.002 0h-0c0.079 0 0.156 0.005 0.235 0.008l3.575-5.176v-0.074c0.003-3.12 2.533-5.648 5.653-5.648 3.122 0 5.653 2.531 5.653 5.653s-2.531 5.653-5.653 5.653h-0.131l-5.094 3.638c0 0.065 0.005 0.131 0.005 0.199 0 0.001 0 0.002 0 0.003 0 2.342-1.899 4.241-4.241 4.241-2.047 0-3.756-1.451-4.153-3.38l-0.005-0.027-5.755-2.383c1.841 6.345 7.601 10.905 14.425 10.905 8.281 0 14.994-6.713 14.994-14.994s-6.713-14.994-14.994-14.994c-0 0-0.001 0-0.001 0h0z"></path>
    </svg>
  );

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "200px",
            color: "canvasText",
            opacity: 0.6,
            fontSize: "0.875rem",
          }}
        >
          Loading games...
        </div>
      </BaseWidget>
    );
  }

  if (games.length === 0) {
    return (
      <BaseWidget padding="1rem 0.75rem 1rem 1rem">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "200px",
            color: "canvasText",
            opacity: 0.6,
            fontSize: "0.875rem",
          }}
        >
          No games available
        </div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget padding="1rem 0.75rem 1rem 1rem" style={{ gap: "0.75rem" }}>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {games.map((game, index) => {
            const isActive = index === currentIndex;
            const shouldRenderContent = isActive;
            return (
              <div
                key={game.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateX(0)" : "translateX(20px)",
                  transition:
                    "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  pointerEvents: isActive ? "all" : "none",
                  cursor: "pointer",
                }}
                onMouseUp={(e) => {
                  // Only navigate if it wasn't a drag (check after mouse up)
                  if (onGameClick && e.button === 0) {
                    // Check if click was on thumbnail container
                    const clickedThumbnail = e.target.closest(
                      "[data-thumbnail-container]"
                    );
                    if (clickedThumbnail) return;

                    // Small delay to let drag system update
                    setTimeout(() => {
                      const wasDrag =
                        wasLastInteractionDrag &&
                        typeof wasLastInteractionDrag === "function"
                          ? wasLastInteractionDrag(widgetId)
                          : false;

                      if (!wasDrag) {
                        onGameClick(game);
                      }
                    }, 10);
                  }
                }}
              >
                {shouldRenderContent ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      padding: 0,
                      animation: "fadeInUp 0.6s ease-out",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      flexShrink: 0,
                      flexDirection: isMobile() ? "column" : "row",
                    }}
                  >
                    <div
                      style={{
                        flex: isMobile() ? "0 0 100%" : 1,
                        minWidth: 0,
                        width: isMobile() ? "100%" : undefined,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: isMobile() ? "wrap" : "nowrap",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: sizeClass.includes("short")
                                ? "1rem"
                                : sizeClass.includes("very-short")
                                ? "0.9375rem"
                                : "1.125rem",
                              fontWeight: 600,
                              margin: 0,
                              color: "canvasText",
                              letterSpacing: "-0.01em",
                              lineHeight: 1.3,
                              flex: sizeClass.includes("narrow")
                                ? "0 0 100%"
                                : 1,
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {game.title}
                          </h4>
                          {!isMobile() && (
                            /* Technology and link chips next to title when not mobile */
                            <div
                              style={{
                                display: sizeClass.includes("very-short")
                                  ? "none"
                                  : "flex",
                                flexWrap: "wrap",
                                gap: "0.375rem",
                                alignItems: "center",
                                flexShrink: 0,
                                overflow: "visible",
                              }}
                            >
                              {/* Technology chips */}
                              {getGameChips(game.id).map((chip, chipIndex) => (
                                <div
                                  key={chipIndex}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: sizeClass.includes("short")
                                      ? "0.1875rem 0.375rem"
                                      : "0.25rem 0.5rem",
                                    borderRadius: "2px",
                                    background:
                                      "color-mix(in hsl, canvasText, transparent 90%)",
                                    border:
                                      "1px solid color-mix(in hsl, canvasText, transparent 20%)",
                                    fontSize: sizeClass.includes("short")
                                      ? "0.625rem"
                                      : "0.6875rem",
                                    fontWeight: 500,
                                    color: "canvasText",
                                    opacity: 0.9,
                                    whiteSpace: "nowrap",
                                    userSelect: "none",
                                  }}
                                >
                                  {chip}
                                </div>
                              ))}
                              {/* Link chips */}
                              {getGameLinks(game.id).map((link, linkIndex) => (
                                <a
                                  key={linkIndex}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.375rem",
                                    padding: sizeClass.includes("short")
                                      ? "0.1875rem 0.375rem"
                                      : "0.25rem 0.5rem",
                                    borderRadius: "2px",
                                    background:
                                      "color-mix(in hsl, canvasText, transparent 90%)",
                                    border:
                                      "1px solid color-mix(in hsl, canvasText, transparent 20%)",
                                    fontSize: sizeClass.includes("short")
                                      ? "0.625rem"
                                      : "0.6875rem",
                                    fontWeight: 500,
                                    color: "canvasText",
                                    opacity: 0.9,
                                    textDecoration: "none",
                                    whiteSpace: "nowrap",
                                    transition: "opacity 0.2s, transform 0.2s",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    boxSizing: "border-box",
                                    transformOrigin: "center",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = "1";
                                    e.currentTarget.style.transform =
                                      "scale(1.05)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = "0.9";
                                    e.currentTarget.style.transform =
                                      "scale(1)";
                                  }}
                                >
                                  {link.type === "steam" &&
                                    renderSteamIcon(
                                      sizeClass.includes("short") ? "12" : "14"
                                    )}
                                  <span>{link.label}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        {isMobile() && (
                          /* Technology and link chips below title when mobile */
                          <div
                            style={{
                              display: sizeClass.includes("very-short")
                                ? "none"
                                : "flex",
                              flexWrap: "wrap",
                              gap: "0.375rem",
                              alignItems: "center",
                              overflow: "visible",
                            }}
                          >
                            {/* Technology chips */}
                            {getGameChips(game.id).map((chip, chipIndex) => (
                              <div
                                key={chipIndex}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: sizeClass.includes("short")
                                    ? "0.1875rem 0.375rem"
                                    : "0.25rem 0.5rem",
                                  borderRadius: "2px",
                                  background:
                                    "color-mix(in hsl, canvasText, transparent 90%)",
                                  border:
                                    "1px solid color-mix(in hsl, canvasText, transparent 20%)",
                                  fontSize: sizeClass.includes("short")
                                    ? "0.625rem"
                                    : "0.6875rem",
                                  fontWeight: 500,
                                  color: "canvasText",
                                  opacity: 0.9,
                                  whiteSpace: "nowrap",
                                  userSelect: "none",
                                }}
                              >
                                {chip}
                              </div>
                            ))}
                            {/* Link chips */}
                            {getGameLinks(game.id).map((link, linkIndex) => (
                              <a
                                key={linkIndex}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.375rem",
                                  padding: sizeClass.includes("short")
                                    ? "0.1875rem 0.375rem"
                                    : "0.25rem 0.5rem",
                                  borderRadius: "2px",
                                  background:
                                    "color-mix(in hsl, canvasText, transparent 90%)",
                                  border:
                                    "1px solid color-mix(in hsl, canvasText, transparent 20%)",
                                  fontSize: sizeClass.includes("short")
                                    ? "0.625rem"
                                    : "0.6875rem",
                                  fontWeight: 500,
                                  color: "canvasText",
                                  opacity: 0.9,
                                  textDecoration: "none",
                                  whiteSpace: "nowrap",
                                  transition: "opacity 0.2s, transform 0.2s",
                                  cursor: "pointer",
                                  userSelect: "none",
                                  boxSizing: "border-box",
                                  transformOrigin: "center",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = "1";
                                  e.currentTarget.style.transform =
                                    "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = "0.9";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}
                              >
                                {link.type === "steam" &&
                                  renderSteamIcon(
                                    sizeClass.includes("short") ? "12" : "14"
                                  )}
                                <span>{link.label}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.75rem",
                          opacity: 0.7,
                          color: "canvasText",
                          marginTop: sizeClass.includes("very-short")
                            ? "0"
                            : sizeClass.includes("short")
                            ? "0.5rem"
                            : "0.75rem",
                        }}
                      >
                        {game.teamIcon && (
                          <img
                            src={game.teamIcon}
                            alt={game.tech}
                            draggable="false"
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "2px",
                              objectFit: "cover",
                              flexShrink: 0,
                              userSelect: "none",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {game.tech}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      flex: 1,
                      minHeight: 0,
                      position: "relative",
                    }}
                  >
                    <MediaCarousel
                      media={getMediaArray(game)}
                      title={game.title}
                      layout="auto"
                      currentIndex={imageIndices[game.id] || 0}
                      onIndexChange={(nextIndex) => {
                        setImageIndices((prev) => ({
                          ...prev,
                          [game.id]: nextIndex,
                        }));
                      }}
                      autoAdvance={false}
                      carouselId={`games-${game.id}`}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.625rem",
                      flexShrink: 0,
                    }}
                  >
                    <p
                      style={{
                        fontSize: sizeClass.includes("short")
                          ? "0.75rem"
                          : "0.8125rem",
                        lineHeight: 1.5,
                        opacity: 0.85,
                        color: "canvasText",
                        margin: 0,
                        display: sizeClass.includes("very-short")
                          ? "none"
                          : sizeClass.includes("short")
                          ? "-webkit-box"
                          : "-webkit-box",
                        WebkitLineClamp: sizeClass.includes("short") ? 1 : 2,
                        lineClamp: sizeClass.includes("short") ? 1 : 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {game.description}
                    </p>
                  </div>
                </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "0.75rem",
            marginTop: "auto",
            flexShrink: 0,
            flexWrap: isMobile() ? "wrap" : "nowrap",
            gap: sizeClass.includes("narrow") ? "0.25rem" : "0.5rem",
            overflow: "visible",
          }}
        >
          <button
            style={{
              background: "color-mix(in hsl, canvasText, transparent 95%)",
              border: "1px solid color-mix(in hsl, canvasText, transparent 6%)",
              borderRadius: "4px",
              color: "canvasText",
              fontSize: sizeClass.includes("narrow") ? "1rem" : "1.25rem",
              width: sizeClass.includes("narrow") ? "1.75rem" : "2rem",
              height: sizeClass.includes("narrow") ? "1.75rem" : "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity: 0.6,
              transition: "opacity 0.2s, transform 0.2s",
              padding: 0,
              lineHeight: 1,
              boxSizing: "border-box",
              transformOrigin: "center",
              margin: "0.25rem",
            }}
            onClick={goToPrev}
            aria-label="Previous game"
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.6";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
          >
            ‹
          </button>
          <div
            style={{
              display: "flex",
              gap: "0.375rem",
              alignItems: "center",
              flex: 1,
              justifyContent: "center",
            }}
          >
            {games.map((_, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={index}
                  style={{
                    width: isActive ? "8px" : "6px",
                    height: isActive ? "8px" : "6px",
                    borderRadius: "50%",
                    border: "none",
                    background: isActive
                      ? "canvasText"
                      : "color-mix(in hsl, canvasText, transparent 80%)",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.3s ease",
                    opacity: isActive ? 0.8 : 0.4,
                    transform: isActive ? "scale(1.2)" : "scale(1)",
                  }}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to game ${index + 1}`}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.opacity = "0.7";
                      e.currentTarget.style.transform = "scale(1.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.opacity = "0.4";
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                />
              );
            })}
          </div>
          <button
            style={{
              background: "color-mix(in hsl, canvasText, transparent 95%)",
              border: "1px solid color-mix(in hsl, canvasText, transparent 6%)",
              borderRadius: "4px",
              color: "canvasText",
              fontSize: sizeClass.includes("narrow") ? "1rem" : "1.25rem",
              width: sizeClass.includes("narrow") ? "1.75rem" : "2rem",
              height: sizeClass.includes("narrow") ? "1.75rem" : "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity: 0.6,
              transition: "opacity 0.2s, transform 0.2s",
              padding: 0,
              lineHeight: 1,
              boxSizing: "border-box",
              transformOrigin: "center",
              margin: "0.25rem",
            }}
            onClick={goToNext}
            aria-label="Next game"
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.6";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
          >
            ›
          </button>
        </div>
      </div>
    </BaseWidget>
  );
}
