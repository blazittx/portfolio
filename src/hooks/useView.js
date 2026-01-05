import { useState, useEffect } from "react";
import { YOUTUBE_URLS } from "../constants/games";

// Fetch game data by ID
// Uses Netlify function to proxy API calls (works in both dev and production)
const fetchGameById = async (gameId) => {
  const getApiUrl = (id) => {
    return `/api/games/${id}`;
  };

  try {
    const apiUrl = getApiUrl(gameId);
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "omit",
    });

    if (!response.ok) {
      console.warn(`Failed to fetch game ${gameId}:`, response.statusText);
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
    console.error(`Error fetching game ${gameId}:`, error);
    return null;
  }
};

export const useView = () => {
  const [currentView, setCurrentView] = useState("main"); // 'main', 'game-detail', or 'cv-detail'
  const [selectedGame, setSelectedGame] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize from URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    const pathSegment = path.slice(1); // Remove leading '/'

    // Check if it's CV view
    if (pathSegment === "cv") {
      if (currentView !== "cv-detail") {
        setCurrentView("cv-detail");
      }
    } else if (
      pathSegment &&
      pathSegment !== "" &&
      currentView === "main" &&
      !selectedGame
    ) {
      // Try to fetch as game ID
      setIsLoading(true);
      fetchGameById(pathSegment)
        .then((game) => {
          if (game) {
            setSelectedGame(game);
            setCurrentView("game-detail");
          } else {
            // Game not found, redirect to main
            window.history.replaceState(null, "", "/");
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          window.history.replaceState(null, "", "/");
        });
    } else if (!pathSegment || pathSegment === "") {
      // URL is root, ensure we're on main view
      if (currentView !== "main") {
        setCurrentView("main");
        setSelectedGame(null);
      }
    }
  }, [currentView, selectedGame]); // Only run on mount

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const pathSegment = path.slice(1);

      if (pathSegment === "cv") {
        setCurrentView("cv-detail");
        setSelectedGame(null);
      } else if (pathSegment && pathSegment !== "") {
        setIsLoading(true);
        fetchGameById(pathSegment)
          .then((game) => {
            if (game) {
              setSelectedGame(game);
              setCurrentView("game-detail");
            } else {
              setCurrentView("main");
              setSelectedGame(null);
            }
            setIsLoading(false);
          })
          .catch(() => {
            setCurrentView("main");
            setSelectedGame(null);
            setIsLoading(false);
          });
      } else {
        setCurrentView("main");
        setSelectedGame(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToGameDetail = (game) => {
    setSelectedGame(game);
    setCurrentView("game-detail");
    // Update URL to /gameId
    window.history.pushState(null, "", `/${game.id}`);
  };

  const navigateToMain = () => {
    setCurrentView("main");
    setSelectedGame(null);
    // Update URL to root
    window.history.pushState(null, "", "/");
  };

  const navigateToCV = () => {
    setCurrentView("cv-detail");
    // Update URL to /cv
    window.history.pushState(null, "", "/cv");
  };

  return {
    currentView,
    selectedGame,
    navigateToGameDetail,
    navigateToMain,
    navigateToCV,
    isLoading,
  };
};
