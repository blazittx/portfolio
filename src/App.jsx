import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  useWidgets,
  componentMap,
  buildWidgetsFromLayout,
} from "./hooks/useWidgets";
import { useDragAndResize } from "./hooks/useDragAndResize";
import { useAutosort } from "./hooks/useAutosort";
import { useContextMenu } from "./hooks/useContextMenu";
import { useView } from "./hooks/useView";
import { useToast } from "./hooks/useToast";
import { usePageTransition } from "./hooks/usePageTransition";
import ContextMenu from "./components/WidgetSystem/ContextMenu";
import GridBackground from "./components/WidgetSystem/GridBackground";
import GridMask from "./components/WidgetSystem/GridMask";
import WidgetContainer from "./components/WidgetSystem/WidgetContainer";
import GameDetailView from "./components/pages/GameDetailView";
import CVDetailView from "./components/pages/CVDetailView";
import Toaster from "./components/Toaster";
import { getWidgetMinSize, GRID_SIZE } from "./constants/grid";
import { GAME_IDS } from "./constants/games";
import {
  DEFAULT_HOMEPAGE_LAYOUT,
  DEFAULT_HOMEPAGE_LAYOUT_MOBILE,
} from "./utils/setDefaultLayouts";
import {
  snapToGrid,
  snapSizeToGrid,
  constrainToViewport,
  calculateCenterOffset,
  pixelsToGrid,
} from "./utils/grid";
import { findNearestValidPosition } from "./utils/collision";
import { GRID_OFFSET_X, GRID_OFFSET_Y } from "./constants/grid";
import { isMobile } from "./utils/mobile";

function App() {
  const {
    currentView,
    selectedGame,
    navigateToGameDetail: originalNavigateToGameDetail,
    navigateToMain: originalNavigateToMain,
    navigateToCV: originalNavigateToCV,
    isLoading,
  } = useView();
  const [widgets, setWidgets] = useWidgets("main");
  const { transition, animateInitial, animateWidgetsIn } = usePageTransition();
  const previousViewRef = useRef(currentView);
  const isInitialMountRef = useRef(true);

  // Ensure widgets is always an array
  const validWidgets = useMemo(
    () => (Array.isArray(widgets) ? widgets : []),
    [widgets]
  );

  // Calculate center offset to center the layout horizontally and vertically
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isMobileState, setIsMobileState] = useState(() => isMobile());
  const previousMobileStateRef = useRef(isMobileState);
  const [showDebugOutline, setShowDebugOutline] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMobileState(isMobile());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setWindowSize]);

  // Toggle debug outline with F3 key
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F3 key
      if (e.key === "F2") {
        e.preventDefault();
        setShowDebugOutline((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Control") {
        document.body.classList.add("layout-mode");
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === "Control") {
        document.body.classList.remove("layout-mode");
      }
    };
    const handleBlur = () => {
      document.body.classList.remove("layout-mode");
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const centerOffset = useMemo(() => {
    if (currentView !== "main") {
      return { x: 0, y: 0 };
    }
    return calculateCenterOffset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, windowSize.width, windowSize.height]);
  const {
    isDragging,
    isResizing,
    collisionWidgetId,
    swapTargetId,
    dragStateRef,
    resizeStateRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    wasLastInteractionDrag,
  } = useDragAndResize(widgets, setWidgets, centerOffset);

  const autosortWidgets = useAutosort(widgets, setWidgets, centerOffset);
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const { toasts, showToast, removeToast } = useToast();

  // Toggle lock on widget (unpins if pinned)
  const toggleLockWidget = useCallback(
    (widgetId) => {
      setWidgets((prev) =>
        prev.map((w) => {
          if (w.id === widgetId) {
            const newLocked = !w.locked;
            return {
              ...w,
              locked: newLocked,
              pinned: newLocked ? false : w.pinned,
            };
          }
          return w;
        })
      );
      closeContextMenu();
    },
    [setWidgets, closeContextMenu]
  );

  // Toggle pin on widget (unlocks if locked)
  const togglePinWidget = useCallback(
    (widgetId) => {
      setWidgets((prev) =>
        prev.map((w) => {
          if (w.id === widgetId) {
            const newPinned = !w.pinned;
            return {
              ...w,
              pinned: newPinned,
              locked: newPinned ? false : w.locked,
            };
          }
          return w;
        })
      );
      closeContextMenu();
    },
    [setWidgets, closeContextMenu]
  );

  // Remove widget
  const removeWidget = useCallback(
    (widgetId) => {
      setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
      closeContextMenu();
    },
    [setWidgets, closeContextMenu]
  );

  // Update widget settings
  const updateWidgetSettings = useCallback(
    (widgetId, newSettings) => {
      setWidgets((prev) =>
        prev.map((w) => {
          if (w.id === widgetId) {
            return {
              ...w,
              settings: { ...(w.settings || {}), ...newSettings },
            };
          }
          return w;
        })
      );
    },
    [setWidgets]
  );

  const copyLayout = useCallback(() => {
    const layoutToSave = widgets.map(
      ({
        id,
        type,
        x,
        y,
        width,
        height,
        col,
        row,
        w,
        h,
        locked,
        pinned,
        settings,
      }) => {
        const grid =
          typeof col === "number" && typeof row === "number"
            ? { col, row, w, h }
            : pixelsToGrid({ x, y, width, height });
        return {
          id,
          type,
          col: grid.col,
          row: grid.row,
          w: grid.w,
          h: grid.h,
          locked: locked || false,
          pinned: pinned || false,
          settings: settings || {},
        };
      }
    );
    const exportName = isMobile()
      ? "HOMEPAGE_LAYOUT_MOBILE"
      : "HOMEPAGE_LAYOUT";
    const snippet = `export const ${exportName} = ${JSON.stringify(
      layoutToSave,
      null,
      2
    )};`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(snippet)
        .then(() =>
          showToast(`Copied ${isMobile() ? "mobile " : ""}layout snippet!`)
        )
        .catch(() => {
          console.log(snippet);
          showToast("Clipboard blocked. Layout snippet logged to console.");
        });
    } else {
      console.log(snippet);
      showToast("Clipboard unavailable. Layout snippet logged to console.");
    }
  }, [widgets, showToast]);

  // Add widget at position
  const addWidget = useCallback(
    (widgetType, x, y) => {
      const Component = componentMap[widgetType];
      if (!Component) {
        console.warn(`Widget type ${widgetType} not found`);
        return;
      }

      // Use flushSync to ensure the state update happens synchronously
      flushSync(() => {
        setWidgets((prev) => {
          // For widgets that allow multiple instances (like single-game), generate unique IDs
          // For other widgets, check if they already exist
          const allowsMultipleInstances = widgetType === "single-game";

          if (!allowsMultipleInstances) {
            const existingWidget = prev.find(
              (w) => w.type === widgetType || w.id === widgetType
            );
            if (existingWidget) {
              console.warn(`Widget ${widgetType} already exists`);
              return prev;
            }
          }

          // Generate unique ID for widgets that allow multiple instances
          let widgetId = widgetType;
          if (allowsMultipleInstances) {
            // Find the highest number used for this widget type
            const existingWidgets = prev.filter((w) => w.type === widgetType);
            let maxNumber = 0;
            existingWidgets.forEach((w) => {
              const match = w.id.match(new RegExp(`^${widgetType}-(\\d+)$`));
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNumber) {
                  maxNumber = num;
                }
              }
            });
            widgetId = `${widgetType}-${maxNumber + 1}`;
          }

          // Get minimum size for widget
          const minSize = getWidgetMinSize(widgetType);
          const width = snapSizeToGrid(minSize.width);
          const height = snapSizeToGrid(minSize.height);

          // Check if the click position is within reasonable bounds
          // If not, use a default position near existing widgets or at a safe location
          let targetX = x;
          let targetY = y;

          // If position is way off-screen or invalid, find a better default
          if (
            x < 0 ||
            x > window.innerWidth ||
            y < 0 ||
            y > window.innerHeight
          ) {
            // Try to find a position near existing widgets
            if (prev.length > 0) {
              // Find the rightmost widget and place new widget to its right
              const rightmostWidget = prev.reduce((rightmost, w) =>
                w.x + w.width > rightmost.x + rightmost.width ? w : rightmost
              );
              targetX = rightmostWidget.x + rightmostWidget.width + GRID_SIZE;
              targetY = rightmostWidget.y;
            } else {
              // No widgets exist, use a safe default position
              targetX = snapToGrid(100, GRID_OFFSET_X);
              targetY = snapToGrid(100, GRID_OFFSET_Y);
            }
          }

          // Snap position to grid and constrain to viewport
          const snappedX = snapToGrid(targetX, GRID_OFFSET_X);
          const snappedY = snapToGrid(targetY, GRID_OFFSET_Y);
          const constrained = constrainToViewport(
            snappedX,
            snappedY,
            width,
            height,
            centerOffset
          );

          // Find nearest valid position that doesn't collide with existing widgets
          const validPosition = findNearestValidPosition(
            constrained.x,
            constrained.y,
            width,
            height,
            prev,
            null // No widget to exclude
          );

          // Initialize settings based on widget type
          let settings = {};
          if (widgetType === "single-game") {
            settings = { gameId: GAME_IDS[0] }; // Default to first game
          }

          // Create new widget - ensure all properties are set and create a new object
          const newWidget = {
            id: widgetId,
            type: widgetType,
            x: validPosition.x,
            y: validPosition.y,
            width: width,
            height: height,
            component: Component,
            locked: false,
            pinned: false,
            settings: settings,
          };

          // Create a new array with the new widget to ensure React detects the change
          return [...prev, newWidget];
        });
      });

      // Animate the new widget in immediately
      setTimeout(() => {
        animateWidgetsIn();
      }, 50);

      // Close the context menu after state update
      closeContextMenu();
    },
    [setWidgets, closeContextMenu, animateWidgetsIn, centerOffset]
  );

  // Handle mouse down (only for left-click drag, right-click handled by contextmenu)
  const handleMouseDownWithContext = (e, id) => {
    // Only handle left-click for dragging
    if (e.button !== 2) {
      handleMouseDown(e, id);
    }
  };

  // Handle right-click context menu (handles both widgets and empty space)
  const handleContextMenu = (e) => {
    e.preventDefault();
    const target = e.target;
    // Look for element with data-widget-id attribute (widgets have this)
    let widgetElement = target.closest("[data-widget-id]");
    // If not found, also try looking for .widget class as fallback
    if (!widgetElement) {
      widgetElement = target.closest(".widget");
    }
    const widgetId = widgetElement?.getAttribute("data-widget-id") || null;
    openContextMenu(e, widgetId);
  };

  // Wrapped navigation functions with transitions
  const navigateToGameDetail = useCallback(
    async (game) => {
      if (previousViewRef.current === "main") {
        const animateIn = await transition();
        originalNavigateToGameDetail(game);
        await animateIn();
      } else {
        originalNavigateToGameDetail(game);
      }
      previousViewRef.current = "game-detail";
    },
    [transition, originalNavigateToGameDetail]
  );

  const navigateToMain = useCallback(async () => {
    if (
      previousViewRef.current === "game-detail" ||
      previousViewRef.current === "cv-detail"
    ) {
      const animateIn = await transition();
      originalNavigateToMain();
      await animateIn();
    } else {
      originalNavigateToMain();
    }
    previousViewRef.current = "main";
  }, [transition, originalNavigateToMain]);

  const navigateToCV = useCallback(async () => {
    if (previousViewRef.current === "main") {
      const animateIn = await transition();
      originalNavigateToCV();
      await animateIn();
    } else {
      originalNavigateToCV();
    }
    previousViewRef.current = "cv-detail";
  }, [transition, originalNavigateToCV]);

  // Handle view changes for transitions
  useEffect(() => {
    if (previousViewRef.current !== currentView) {
      // View changed, but we already handled the transition in navigation functions
      // This is for browser back/forward navigation
      previousViewRef.current = currentView;
      // Animate widgets in after a brief delay
      setTimeout(() => {
        animateWidgetsIn();
      }, 100);
    }
  }, [currentView, animateWidgetsIn]);

  // Initial animation on mount
  useEffect(() => {
    if (isInitialMountRef.current && widgets.length > 0) {
      isInitialMountRef.current = false;
      animateInitial();
    }
  }, [widgets, animateInitial]);

  // Rebuild layout when switching between mobile and desktop
  useEffect(() => {
    const previousMobile = previousMobileStateRef.current;
    if (previousMobile === isMobileState) {
      return;
    }

    previousMobileStateRef.current = isMobileState;
    const layoutToUse = isMobileState
      ? DEFAULT_HOMEPAGE_LAYOUT_MOBILE
      : DEFAULT_HOMEPAGE_LAYOUT;

    if (layoutToUse && Array.isArray(layoutToUse) && layoutToUse.length > 0) {
      const rebuiltWidgets = buildWidgetsFromLayout(layoutToUse, {
        mobile: isMobileState,
      });
      flushSync(() => {
        setWidgets(rebuiltWidgets);
      });
      setTimeout(() => {
        animateWidgetsIn();
      }, 50);
    }
  }, [isMobileState, setWidgets, animateWidgetsIn]);

  // Attach global mouse events
  useEffect(() => {
    const handleGlobalMove = (e) => handleMouseMove(e);
    const handleGlobalUp = () => handleMouseUp();

    document.addEventListener("mousemove", handleGlobalMove);
    document.addEventListener("mouseup", handleGlobalUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMove);
      document.removeEventListener("mouseup", handleGlobalUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Show loading state while fetching game from URL
  if (isLoading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "canvasText",
          fontSize: "1rem",
          opacity: 0.7,
        }}
      >
        Loading...
      </div>
    );
  }

  // Show game detail view if selected
  if (currentView === "game-detail" && selectedGame) {
    return <GameDetailView game={selectedGame} onBack={navigateToMain} />;
  }

  // Show CV detail view if selected
  if (currentView === "cv-detail") {
    return <CVDetailView onBack={navigateToMain} />;
  }

  const mobile = isMobile();

  return (
    <div
      style={{
        width: "100vw",
        height: mobile ? "auto" : "100vh",
        minHeight: mobile ? "100vh" : "auto",
        overflow: mobile ? "auto" : "hidden",
        overflowX: "hidden", // Prevent horizontal scrolling on all devices
        position: "relative",
      }}
      onContextMenu={handleContextMenu}
    >
      <ContextMenu
        contextMenu={contextMenu}
        widgets={validWidgets}
        onToggleLock={toggleLockWidget}
        onTogglePin={togglePinWidget}
        onRemoveWidget={removeWidget}
        onSort={autosortWidgets}
        onAddWidget={addWidget}
        onCopyLayout={copyLayout}
        onClose={closeContextMenu}
      />

      <GridBackground
        centerOffset={centerOffset}
        showDebugOutline={showDebugOutline}
      />

      <GridMask
        widgets={widgets}
        centerOffset={centerOffset}
        isDragging={isDragging}
        isResizing={isResizing}
        dragStateRef={dragStateRef}
      />

      <WidgetContainer
        widgets={validWidgets}
        isDragging={isDragging}
        isResizing={isResizing}
        collisionWidgetId={collisionWidgetId}
        swapTargetId={swapTargetId}
        dragStateRef={dragStateRef}
        resizeStateRef={resizeStateRef}
        onMouseDown={handleMouseDownWithContext}
        wasLastInteractionDrag={wasLastInteractionDrag}
        onGameClick={navigateToGameDetail}
        onCVClick={navigateToCV}
        centerOffset={centerOffset}
        onUpdateWidgetSettings={updateWidgetSettings}
      />
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
