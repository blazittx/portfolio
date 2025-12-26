import { useState, useEffect, useRef, useMemo } from "react";
import BaseWidget from "./BaseWidget";
import { isMobile } from "../utils/mobile";
import { GRID_SIZE } from "../constants/grid";
import { GAME_IDS, STEAM_URLS, YOUTUBE_URLS, getGameChips, getGameLinks } from "../constants/games";
import {
  isYouTubeUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  setYouTubeVolume,
} from "../utils/youtube";

// Use Netlify function to proxy API calls (works in both dev and production)
const getApiUrl = (gameId) => {
  return `/api/games/${gameId}`;
};

/* eslint-disable react/prop-types */
export default function SingleGameWidget({
  widgetId,
  wasLastInteractionDrag,
  onGameClick,
  widget,
}) {
  // Get gameId from widget settings, default to first game
  // Validate that the gameId exists in GAME_IDS, otherwise use default
  const getInitialGameId = () => {
    const settingsGameId = widget?.settings?.gameId;
    if (settingsGameId && GAME_IDS.includes(settingsGameId)) {
      return settingsGameId;
    }
    return GAME_IDS[0];
  };
  const [selectedGameId, setSelectedGameId] = useState(() =>
    getInitialGameId()
  );
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const [sizeClass, setSizeClass] = useState("");
  const [widthInGridUnits, setWidthInGridUnits] = useState(10); // Default to wide enough to show chips next to title
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const fetchedGameIdRef = useRef(null); // Track which gameId we've already fetched
  const isInitialMountRef = useRef(true); // Track if this is the initial mount
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const intervalRef = useRef(null);
  const thumbnailContainerRef = useRef(null);
  const thumbnailRefs = useRef({});
  const videoIframeRef = useRef(null);

  // Extract gameId from widget settings to use as stable dependency
  const widgetGameId = widget?.settings?.gameId || null;

  // Update selectedGameId when widget settings change (only on mount or when settings actually change)
  useEffect(() => {
    // Validate that the gameId exists in GAME_IDS before using it
    if (widgetGameId && GAME_IDS.includes(widgetGameId)) {
      if (widgetGameId !== selectedGameId) {
        setSelectedGameId(widgetGameId);
      }
    } else if (!widgetGameId || !GAME_IDS.includes(widgetGameId)) {
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
  }, [widgetGameId]); // Only depend on the actual gameId value, not the widget object

  // Fetch game data only on initial mount or when selectedGameId actually changes
  useEffect(() => {
    const fetchGame = async () => {
      if (!selectedGameId) return;

      // Only fetch if:
      // 1. This is the initial mount, OR
      // 2. The selectedGameId changed from what we last fetched
      const isGameIdChange = fetchedGameIdRef.current !== selectedGameId;
      const shouldFetch = isInitialMountRef.current || isGameIdChange;

      if (!shouldFetch) {
        // We already have the data for this gameId, just ensure loading is false
        if (loading) {
          setLoading(false);
        }
        return;
      }

      // Mark that we're past initial mount
      isInitialMountRef.current = false;

      try {
        setLoading(true);
        setError(null);
        fetchedGameIdRef.current = selectedGameId; // Mark as fetching
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
        // Get Steam URL from manual mapping first, then fall back to API data
        const steamUrl =
          STEAM_URLS[selectedGameId] ||
          data.steam_url ||
          data.steam_page_url ||
          null;
        // Get video URL from manual mapping first, then fall back to API data
        const videoUrl =
          YOUTUBE_URLS[selectedGameId] ||
          data.youtube_url ||
          data.video_url ||
          data.trailer_url ||
          null;
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
          steamUrl: steamUrl,
          videoUrl: videoUrl,
        });
        fetchedGameIdRef.current = selectedGameId; // Mark as successfully fetched
      } catch (err) {
        console.error(`Error fetching game ${selectedGameId}:`, err);
        setError(err.message);
        setGame(null);
        fetchedGameIdRef.current = null; // Reset on error so we can retry
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGameId]); // Only fetch when selectedGameId actually changes, not on every re-render

  // Update size class based on container dimensions
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
      // Calculate width in grid units
      const gridUnits = width / GRID_SIZE;
      setWidthInGridUnits(gridUnits);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    let resizeObserver;
    const rafId = requestAnimationFrame(() => {
      updateSizeClass();
      resizeObserver = new ResizeObserver(updateSizeClass);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
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
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  // Build media array: video first (if present), then images
  const mediaArray = useMemo(() => {
    if (!game) return [];
    const media = [];
    // Add video as first item if present
    if (game.videoUrl && isYouTubeUrl(game.videoUrl)) {
      media.push({ type: "video", url: game.videoUrl });
    }
    // Add images (repeat the same image 4 times for now, or until we have multiple images)
    if (game.image) {
      for (let i = 0; i < 4; i++) {
        media.push({ type: "image", url: game.image });
      }
    }
    return media;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.videoUrl, game?.image, game?.id]);

  // Reset image index when game changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [game?.id]);

  // Scroll to selected thumbnail when image index changes
  useEffect(() => {
    if (!game || mediaArray.length === 0) return;

    const thumbnailElement = thumbnailRefs.current[currentImageIndex];
    if (thumbnailElement && thumbnailContainerRef.current && !isHovered) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // On mobile, scroll within the container only to avoid page scrolling
        if (isMobile()) {
          const container = thumbnailContainerRef.current;
          const element = thumbnailElement;
          if (container && element) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            // Calculate scroll position to center the thumbnail in the container
            const scrollTop =
              element.offsetTop -
              container.offsetTop -
              containerRect.height / 2 +
              elementRect.height / 2;

            container.scrollTo({
              top: scrollTop,
              behavior: "smooth",
            });
          }
        } else {
          // On desktop, use scrollIntoView with block: 'nearest' to avoid page scrolling
          thumbnailElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIndex, game?.id, isHovered, mediaArray.length]);

  // Listen for YouTube iframe events to detect video playback state
  useEffect(() => {
    const handleMessage = (event) => {
      // Only accept messages from YouTube
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        let data;
        if (typeof event.data === 'string') {
          // YouTube sends events as strings that need parsing
          if (event.data.startsWith('{')) {
            data = JSON.parse(event.data);
          } else {
            // Some YouTube messages are not JSON
            return;
          }
        } else {
          data = event.data;
        }
        
        // YouTube iframe API events
        if (data.event === 'onStateChange') {
          // YouTube player states:
          // -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = cued
          const state = data.info !== undefined ? data.info : data;
          const isPlaying = state === 1 || state === 3; // Playing or buffering
          setIsVideoPlaying(isPlaying);
        }
      } catch (error) {
        // Ignore parsing errors for non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Auto-scroll images (stop only if video is playing)
  useEffect(() => {
    if (!game || mediaArray.length === 0) return;

    // Stop auto-scrolling if video is actively playing
    if (isVideoPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // If we're on the video but it's not playing, auto-scroll to images after a delay
    const isVideoActive = currentImageIndex === 0 && mediaArray[0]?.type === "video";
    if (isVideoActive && !isVideoPlaying) {
      // Wait a bit to see if user will play, then auto-scroll to images
      const timer = setTimeout(() => {
        if (!isVideoPlaying && mediaArray.length > 1) {
          setCurrentImageIndex(1); // Move to first image
        }
      }, 5000); // Wait 5 seconds before auto-scrolling away from video
      
      return () => clearTimeout(timer);
    }

    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % mediaArray.length;
          // Skip video if we're auto-scrolling (only show it when manually selected)
          if (nextIndex === 0 && mediaArray[0]?.type === "video") {
            return 1 % mediaArray.length; // Skip to first image
          }
          return nextIndex;
        });
      }, 3000); // Auto-scroll every 3 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHovered,
    game?.id,
    game?.image,
    game?.videoUrl,
    mediaArray.length,
    currentImageIndex,
    isVideoPlaying,
  ]);

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  // Get chips and links for current game
  const gameChips = useMemo(() => {
    return getGameChips(selectedGameId);
  }, [selectedGameId]);

  const gameLinks = useMemo(() => {
    return getGameLinks(selectedGameId);
  }, [selectedGameId]);

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

  // Set YouTube volume to 50% and reset playing state when video iframe loads or changes
  useEffect(() => {
    if (videoIframeRef.current && mediaArray[currentImageIndex]?.type === 'video') {
      // Reset playing state when switching to video
      setIsVideoPlaying(false);
      // Small delay to ensure iframe is ready
      const timer = setTimeout(() => {
        setYouTubeVolume(videoIframeRef.current, 50);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Reset playing state when switching away from video
      setIsVideoPlaying(false);
    }
  }, [currentImageIndex, mediaArray, game?.id]);

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
          Loading game...
        </div>
      </BaseWidget>
    );
  }

  if (error) {
    return (
      <BaseWidget padding="1rem 0.75rem 1rem 1rem">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "200px",
            color: "canvasText",
            opacity: 0.6,
            fontSize: "0.875rem",
            gap: "0.5rem",
          }}
        >
          <div>Error loading game</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.5 }}>{error}</div>
        </div>
      </BaseWidget>
    );
  }

  if (!game) {
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
          No game selected
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
      >
        {/* Game content */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            cursor: "pointer",
          }}
          onMouseUp={(e) => {
            // Only navigate if it wasn't a drag and not clicking on dropdown
            if (onGameClick && e.button === 0) {
              // Check if click was on dropdown or dropdown menu
              const clickedDropdown =
                e.target.closest("[data-dropdown-trigger]") ||
                e.target.closest("[data-dropdown-menu]");

              // Check if click was on thumbnail container
              const clickedThumbnail = e.target.closest(
                "[data-thumbnail-container]"
              );

              if (!clickedDropdown && !clickedThumbnail) {
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
            }
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "0.75rem",
              flexShrink: 0,
              flexDirection: sizeClass.includes("narrow") ? "column" : "row",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                position: "relative",
              }}
              ref={dropdownRef}
            >
              {/* Title as dropdown with chips */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  data-dropdown-trigger
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    userSelect: "none",
                    flexWrap: sizeClass.includes("narrow") ? "wrap" : "nowrap",
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
                      flex:
                        sizeClass.includes("narrow") || widthInGridUnits < 9
                          ? "0 0 calc(100% - 1.5rem)"
                          : 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {game.title}
                  </h4>
                  {!sizeClass.includes("narrow") && widthInGridUnits >= 9 && (
                    /* Chips next to title when not narrow and width >= 9 grid units */
                    <div
                      style={{
                        display: sizeClass.includes("very-short")
                          ? "none"
                          : "flex",
                        flexWrap: "wrap",
                        gap: "0.375rem",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {/* Technology chips */}
                      {gameChips.map((chip, index) => (
                        <div
                          key={index}
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
                      {gameLinks.map((link, index) => (
                        <a
                          key={index}
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
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "1";
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "0.9";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          {link.type === "steam" && renderSteamIcon(sizeClass.includes("short") ? "12" : "14")}
                          <span>{link.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: sizeClass.includes("short")
                        ? "0.625rem"
                        : sizeClass.includes("very-short")
                        ? "0.5625rem"
                        : "0.75rem",
                      color: "canvasText",
                      opacity: 0.5,
                      flexShrink: 0,
                      transition: "transform 0.2s",
                      transform: isDropdownOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      display: "inline-block",
                      lineHeight: 1,
                      marginTop: "0.125rem",
                    }}
                  >
                    ▼
                  </span>
                </div>
                {/* Chips below title when narrow or width < 9 grid units */}
                {(sizeClass.includes("narrow") || widthInGridUnits < 9) && (
                  <div
                    style={{
                      display: sizeClass.includes("very-short")
                        ? "none"
                        : "flex",
                      flexWrap: "wrap",
                      gap: "0.375rem",
                      alignItems: "center",
                    }}
                  >
                    {/* Technology chips */}
                    {gameChips.map((chip, index) => (
                      <div
                        key={index}
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
                    {gameLinks.map((link, index) => (
                      <a
                        key={index}
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
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "1";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {link.type === "steam" && renderSteamIcon(sizeClass.includes("short") ? "12" : "14")}
                        <span>{link.label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div
                  data-dropdown-menu
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "0.25rem",
                    background:
                      "color-mix(in hsl, hsl(0 0% 4%), transparent 5%)",
                    border:
                      "1px solid color-mix(in hsl, canvasText, transparent 10%)",
                    borderRadius: "4px",
                    boxShadow:
                      "0 4px 12px color-mix(in hsl, canvasText, transparent 95%)",
                    backdropFilter: "blur(10px)",
                    zIndex: 1000,
                    overflow: "hidden",
                    maxHeight: "200px",
                    overflowY: "auto",
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
                        padding: "0.5rem 0.75rem",
                        color: "canvasText",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        backgroundColor:
                          selectedGameId === gameId
                            ? "color-mix(in hsl, canvasText, transparent 90%)"
                            : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedGameId !== gameId) {
                          e.currentTarget.style.backgroundColor =
                            "color-mix(in hsl, canvasText, transparent 90%)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedGameId !== gameId) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {gameId.charAt(0).toUpperCase() + gameId.slice(1)}
                    </div>
                  ))}
                </div>
              )}
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
                    ? "0.25rem"
                    : "0.375rem",
                }}
              >
                {game.teamIcon && (
                  <img
                    src={game.teamIcon}
                    alt={game.tech}
                    draggable="false"
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

          {mediaArray.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "0.5rem",
                flex: 1,
                minHeight: 0,
                position: "relative",
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Large media display on left */}
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  minWidth: 0,
                  minHeight: 0,
                  overflow: "hidden",
                  borderRadius: "4px",
                  background: "color-mix(in hsl, canvasText, transparent 98%)",
                }}
              >
                {(() => {
                  const currentMedia = mediaArray[currentImageIndex];
                  if (!currentMedia) return null;

                  if (currentMedia.type === "video") {
                    const embedUrl = getYouTubeEmbedUrl(currentMedia.url, {
                      autoplay: 0,
                      controls: 1,
                      rel: 0,
                    });
                    return (
                      <iframe
                        ref={videoIframeRef}
                        key={`video-${game.id}-${currentImageIndex}`}
                        src={embedUrl}
                        title={`${game.title} - Video`}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          display: "block",
                        }}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onMouseDown={(e) => e.stopPropagation()}
                        onLoad={() => {
                          // Set volume to 50% when iframe loads
                          if (videoIframeRef.current) {
                            setTimeout(() => {
                              setYouTubeVolume(videoIframeRef.current, 50);
                            }, 100);
                          }
                        }}
                      />
                    );
                  } else {
                    return (
                      <img
                        src={currentMedia.url}
                        alt={`${game.title} - Image ${currentImageIndex + 1}`}
                        draggable="false"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          userSelect: "none",
                          transition: "opacity 0.3s ease",
                        }}
                        loading="lazy"
                        onDragStart={(e) => e.preventDefault()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/800x600?text=Game+Image";
                        }}
                      />
                    );
                  }
                })()}
              </div>

              {/* Thumbnail images on right, vertically stacked */}
              <div
                ref={thumbnailContainerRef}
                data-thumbnail-container
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  overflowY: "auto",
                  overflowX: "hidden",
                  paddingRight: "0.25rem",
                  flexShrink: 0,
                  width: "60px",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  // Prevent page scrolling when scrolling thumbnails on mobile
                  touchAction: "pan-y",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {mediaArray.map((media, index) => {
                  const thumbnailUrl =
                    media.type === "video"
                      ? getYouTubeThumbnailUrl(media.url)
                      : media.url;

                  return (
                    <div
                      key={index}
                      ref={(el) => {
                        if (el) thumbnailRefs.current[index] = el;
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleThumbnailClick(index);
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
                        position: "relative",
                        width: "60px",
                        height: "60px",
                        flexShrink: 0,
                        borderRadius: "4px",
                        overflow: "hidden",
                        cursor: "pointer",
                        border:
                          currentImageIndex === index
                            ? "2px solid canvasText"
                            : "2px solid transparent",
                        opacity: currentImageIndex === index ? 1 : 0.7,
                        transition: "opacity 0.2s ease, border-color 0.2s ease",
                        background:
                          "color-mix(in hsl, canvasText, transparent 98%)",
                      }}
                      onMouseEnter={(e) => {
                        if (currentImageIndex !== index) {
                          e.currentTarget.style.opacity = "0.9";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentImageIndex !== index) {
                          e.currentTarget.style.opacity = "0.7";
                        }
                      }}
                    >
                      {media.type === "video" ? (
                        <>
                          <img
                            src={
                              thumbnailUrl ||
                              "https://via.placeholder.com/60x60?text=Video"
                            }
                            alt={`${game.title} - Video thumbnail`}
                            draggable="false"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                              userSelect: "none",
                            }}
                            loading="lazy"
                            onDragStart={(e) => e.preventDefault()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/60x60?text=Video";
                            }}
                          />
                          {/* Play icon overlay */}
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: "rgba(0, 0, 0, 0.7)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              pointerEvents: "none",
                            }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="white"
                              style={{ marginLeft: "2px" }}
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <img
                          src={thumbnailUrl}
                          alt={`${game.title} - Thumbnail ${index + 1}`}
                          draggable="false"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            userSelect: "none",
                          }}
                          loading="lazy"
                          onDragStart={(e) => e.preventDefault()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/60x60?text=Image";
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                fontSize: sizeClass.includes("short") ? "0.75rem" : "0.8125rem",
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
      </div>
    </BaseWidget>
  );
}
