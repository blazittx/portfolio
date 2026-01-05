import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useWidgets } from "../../hooks/useWidgets";
import { useDragAndResize } from "../../hooks/useDragAndResize";
import { useAutosort } from "../../hooks/useAutosort";
import { useContextMenu } from "../../hooks/useContextMenu";
import { useToast } from "../../hooks/useToast";
import { usePageTransition } from "../../hooks/usePageTransition";
import ContextMenu from "../WidgetSystem/ContextMenu";
import GridBackground from "../WidgetSystem/GridBackground";
import GridMask from "../WidgetSystem/GridMask";
import WidgetContainer from "../WidgetSystem/WidgetContainer";
import Toaster from "../Toaster";
import {
  snapToGrid,
  snapSizeToGrid,
  constrainToViewport,
  constrainSizeToViewport,
  calculateCenterOffset,
  gridToPixels,
  pixelsToGrid,
} from "../../utils/grid";
import { GRID_OFFSET_X, GRID_OFFSET_Y } from "../../constants/grid";
import { isMobile } from "../../utils/mobile";
import BackButtonWidget from "../widgets/GameDetailWidgets/BackButtonWidget";
import ProfileWidget from "../widgets/ProfileWidget";
import ProfilePictureWidget from "../widgets/ProfilePictureWidget";
import ExperienceWidget from "../widgets/CVWidgets/ExperienceWidget";
import EducationWidget from "../widgets/CVWidgets/EducationWidget";
import ProjectsWidget from "../widgets/CVWidgets/ProjectsWidget";
import TechnicalSkillsWidget from "../widgets/CVWidgets/TechnicalSkillsWidget";
import LanguagesWidget from "../widgets/CVWidgets/LanguagesWidget";
import CertificationsWidget from "../widgets/CVWidgets/CertificationsWidget";
import { getWidgetMinSize } from "../../constants/grid";
import { DEFAULT_CV_DETAIL_LAYOUT } from "../../utils/setDefaultLayouts";

// Component map for CV detail widgets
const cvDetailComponentMap = {
  "back-button": BackButtonWidget,
  profile: ProfileWidget,
  "profile-picture": ProfilePictureWidget,
  experience: ExperienceWidget,
  education: EducationWidget,
  projects: ProjectsWidget,
  "technical-skills": TechnicalSkillsWidget,
  languages: LanguagesWidget,
  certifications: CertificationsWidget,
};

/* eslint-disable react/prop-types */

export default function CVDetailView({ onBack }) {
  const [widgets, setWidgets] = useWidgets("cv-detail");
  const initializedRef = useRef(false);
  const { animateInitial, animateWidgetsIn } = usePageTransition();
  const isInitialMountRef = useRef(true);
  const previousWidgetsLengthRef = useRef(0);
  const previousWidgetIdsRef = useRef([]);

  // Calculate center offset to center the CV grid (13x19 cells)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showDebugOutline, setShowDebugOutline] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setWindowSize]);

  // Toggle debug outline with F2 key
  useEffect(() => {
    const handleKeyDown = (e) => {
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

  // Calculate center offset for CV grid (13x19 cells)
  const centerOffset = useMemo(() => {
    return calculateCenterOffset("cv-detail");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize.width, windowSize.height]);

  const {
    isDragging,
    isResizing,
    collisionWidgetId,
    dragStateRef,
    resizeStateRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useDragAndResize(widgets, setWidgets, centerOffset, "cv-detail");

  // Initialize widgets layout on mount
  useEffect(() => {
    if (initializedRef.current) return;

    const layoutToUse = DEFAULT_CV_DETAIL_LAYOUT;

    if (layoutToUse && Array.isArray(layoutToUse) && layoutToUse.length > 0) {
      const restoredWidgets = layoutToUse
        .map((widget) => {
          try {
            let component = null;
            if (widget.id === "back-button" || widget.type === "back-button") {
              component = () => <BackButtonWidget onBack={onBack} />;
            } else if (widget.id === "profile" || widget.type === "profile") {
              component = ProfileWidget;
            } else if (
              widget.id === "profile-picture" ||
              widget.type === "profile-picture"
            ) {
              component = ProfilePictureWidget;
            } else if (
              widget.id === "experience" ||
              widget.type === "experience"
            ) {
              component = ExperienceWidget;
            } else if (
              widget.id === "education" ||
              widget.type === "education"
            ) {
              component = EducationWidget;
            } else if (widget.id === "projects" || widget.type === "projects") {
              component = ProjectsWidget;
            } else if (
              widget.id === "technical-skills" ||
              widget.type === "technical-skills"
            ) {
              component = TechnicalSkillsWidget;
            } else if (
              widget.id === "languages" ||
              widget.type === "languages"
            ) {
              component = LanguagesWidget;
            } else if (
              widget.id === "certifications" ||
              widget.type === "certifications"
            ) {
              component = CertificationsWidget;
            }

            if (!component) {
              console.warn(
                `Widget component not found for type: ${widget.type}, id: ${widget.id}`
              );
              return null;
            }

            let settings = widget.settings || {};
            const hasGridUnits =
              typeof widget.col === "number" && typeof widget.row === "number";
            const baseGrid = hasGridUnits
              ? { col: widget.col, row: widget.row, w: widget.w, h: widget.h }
              : pixelsToGrid({
                  x: widget.x,
                  y: widget.y,
                  width: widget.width,
                  height: widget.height,
                });
            const basePixels = gridToPixels(baseGrid);

            return {
              ...widget,
              x: basePixels.x,
              y: basePixels.y,
              width: basePixels.width,
              height: basePixels.height,
              col: baseGrid.col,
              row: baseGrid.row,
              w: baseGrid.w,
              h: baseGrid.h,
              component: component,
              locked: widget.locked || false,
              pinned: widget.pinned || false,
              settings: Object.keys(settings).length > 0 ? settings : undefined,
            };
          } catch (error) {
            console.error(`Error restoring widget ${widget.id}:`, error);
            return null;
          }
        })
        .filter((widget) => widget !== null);

      // Ensure back button exists and is locked
      const hasBackButton = restoredWidgets.some((w) => w.id === "back-button");
      if (!hasBackButton) {
        const backButtonWidth = snapSizeToGrid(120);
        const backButtonHeight = snapSizeToGrid(60);
        const backButtonX = snapToGrid(
          GRID_OFFSET_X + centerOffset.x,
          GRID_OFFSET_X
        );
        const backButtonY = snapToGrid(
          GRID_OFFSET_Y + centerOffset.y,
          GRID_OFFSET_Y
        );

        restoredWidgets.unshift({
          id: "back-button",
          type: "back-button",
          x: backButtonX,
          y: backButtonY,
          width: backButtonWidth,
          height: backButtonHeight,
          component: () => <BackButtonWidget onBack={onBack} />,
          locked: true,
          pinned: false,
        });
      } else {
        const backButton = restoredWidgets.find((w) => w.id === "back-button");
        if (backButton) {
          backButton.locked = true;
          backButton.component = () => <BackButtonWidget onBack={onBack} />;
        }
      }

      setWidgets(restoredWidgets);
      initializedRef.current = true;
      return;
    }

    // Default layout: just back button (hardcoded fallback)
    const backButtonWidth = snapSizeToGrid(120);
    const backButtonHeight = snapSizeToGrid(60);
    const backButtonX = snapToGrid(
      GRID_OFFSET_X + centerOffset.x,
      GRID_OFFSET_X
    );
    const backButtonY = snapToGrid(
      GRID_OFFSET_Y + centerOffset.y,
      GRID_OFFSET_Y
    );

    const defaultWidgets = [
      {
        id: "back-button",
        type: "back-button",
        x: backButtonX,
        y: backButtonY,
        width: backButtonWidth,
        height: backButtonHeight,
        component: () => <BackButtonWidget onBack={onBack} />,
        locked: true,
        pinned: false,
      },
    ];

    setWidgets(defaultWidgets);
    initializedRef.current = true;
  }, [onBack, setWidgets, centerOffset]);

  // Initial animation on mount or when widgets are first set
  useEffect(() => {
    if (
      isInitialMountRef.current &&
      widgets.length > 0 &&
      initializedRef.current
    ) {
      isInitialMountRef.current = false;
      previousWidgetsLengthRef.current = widgets.length;
      previousWidgetIdsRef.current = widgets.map((w) => w.id);
      setTimeout(() => {
        animateInitial();
      }, 100);
    } else if (
      widgets.length > 0 &&
      initializedRef.current &&
      !isInitialMountRef.current
    ) {
      const currentWidgetIds = widgets.map((w) => w.id).sort();
      const previousWidgetIds = previousWidgetIdsRef.current.sort();
      const lengthChanged = widgets.length !== previousWidgetsLengthRef.current;
      const idsChanged =
        JSON.stringify(currentWidgetIds) !== JSON.stringify(previousWidgetIds);

      if (lengthChanged || idsChanged) {
        previousWidgetsLengthRef.current = widgets.length;
        previousWidgetIdsRef.current = widgets.map((w) => w.id);
        setTimeout(() => {
          animateWidgetsIn();
        }, 50);
      } else {
        previousWidgetsLengthRef.current = widgets.length;
        previousWidgetIdsRef.current = widgets.map((w) => w.id);
      }
    }
  }, [widgets, animateInitial, animateWidgetsIn]);

  const validWidgets = useMemo(
    () => (Array.isArray(widgets) ? widgets : []),
    [widgets]
  );

  const autosortWidgets = useAutosort(widgets, setWidgets);
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const { toasts, showToast, removeToast } = useToast();

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

  const addWidget = useCallback(
    (widgetType, x, y) => {
      const Component = cvDetailComponentMap[widgetType];
      if (!Component) {
        console.warn(`Widget type ${widgetType} not found`);
        return;
      }

      setWidgets((prev) => {
        if (widgetType !== "back-button") {
          const existingWidget = prev.find(
            (w) => w.type === widgetType || w.id === widgetType
          );
          if (existingWidget) {
            console.warn(`Widget ${widgetType} already exists`);
            return prev;
          }
        }

        const minSize = getWidgetMinSize(widgetType);
        const width = snapSizeToGrid(minSize.width);
        const height = snapSizeToGrid(minSize.height);

        const snappedX = snapToGrid(x, GRID_OFFSET_X);
        const snappedY = snapToGrid(y, GRID_OFFSET_Y);

        const constrainedPos = constrainToViewport(
          snappedX,
          snappedY,
          width,
          height,
          centerOffset,
          true,
          "cv-detail"
        );
        const constrainedSize = constrainSizeToViewport(
          constrainedPos.x,
          constrainedPos.y,
          width,
          height,
          minSize.width,
          minSize.height,
          centerOffset,
          "cv-detail"
        );

        // Initialize settings based on widget type
        let settings = {};
        if (widgetType === "profile-picture") {
          /* empty */
        }

        let component = null;
        if (widgetType === "back-button") {
          component = () => <BackButtonWidget onBack={onBack} />;
        } else if (widgetType === "profile") {
          component = ProfileWidget;
        } else if (widgetType === "profile-picture") {
          component = ProfilePictureWidget;
        } else if (widgetType === "experience") {
          component = ExperienceWidget;
        } else if (widgetType === "education") {
          component = EducationWidget;
        } else if (widgetType === "projects") {
          component = ProjectsWidget;
        } else if (widgetType === "technical-skills") {
          component = TechnicalSkillsWidget;
        } else if (widgetType === "languages") {
          component = LanguagesWidget;
        } else if (widgetType === "certifications") {
          component = CertificationsWidget;
        }

        if (!component) {
          console.warn(`Component not found for widget type: ${widgetType}`);
          return prev;
        }

        const newWidget = {
          id: widgetType,
          type: widgetType,
          x: constrainedPos.x,
          y: constrainedPos.y,
          width: constrainedSize.width,
          height: constrainedSize.height,
          component: component,
          locked: widgetType === "back-button",
          pinned: false,
          settings: Object.keys(settings).length > 0 ? settings : undefined,
        };

        return [...prev, newWidget];
      });

      closeContextMenu();
    },
    [setWidgets, closeContextMenu, onBack, centerOffset]
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
    const snippet = `export const CV_DETAIL_LAYOUT = ${JSON.stringify(
      layoutToSave,
      null,
      2
    )};`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(snippet)
        .then(() => showToast("Copied layout snippet!"))
        .catch(() => {
          console.log(snippet);
          showToast("Clipboard blocked. Layout snippet logged to console.");
        });
    } else {
      console.log(snippet);
      showToast("Clipboard unavailable. Layout snippet logged to console.");
    }
  }, [widgets, showToast]);

  const revertToDefault = useCallback(() => {
    const defaultLayout = DEFAULT_CV_DETAIL_LAYOUT;

    if (
      defaultLayout &&
      Array.isArray(defaultLayout) &&
      defaultLayout.length > 0
    ) {
      // Restore from default layout - use exact positions without constraining
      const restoredWidgets = defaultLayout
        .map((widget) => {
          try {
            // Map widget types to components
            let component = null;
            if (widget.id === "back-button" || widget.type === "back-button") {
              component = () => <BackButtonWidget onBack={onBack} />;
            } else if (widget.id === "profile" || widget.type === "profile") {
              component = ProfileWidget;
            } else if (
              widget.id === "profile-picture" ||
              widget.type === "profile-picture"
            ) {
              component = ProfilePictureWidget;
            } else if (
              widget.id === "experience" ||
              widget.type === "experience"
            ) {
              component = ExperienceWidget;
            } else if (
              widget.id === "education" ||
              widget.type === "education"
            ) {
              component = EducationWidget;
            } else if (widget.id === "projects" || widget.type === "projects") {
              component = ProjectsWidget;
            } else if (
              widget.id === "technical-skills" ||
              widget.type === "technical-skills"
            ) {
              component = TechnicalSkillsWidget;
            } else if (
              widget.id === "languages" ||
              widget.type === "languages"
            ) {
              component = LanguagesWidget;
            } else if (
              widget.id === "certifications" ||
              widget.type === "certifications"
            ) {
              component = CertificationsWidget;
            }

            if (!component) {
              console.warn(
                `Widget component not found for type: ${widget.type}, id: ${widget.id}`
              );
              return null;
            }

            const hasGridUnits =
              typeof widget.col === "number" && typeof widget.row === "number";
            const baseGrid = hasGridUnits
              ? { col: widget.col, row: widget.row, w: widget.w, h: widget.h }
              : pixelsToGrid({
                  x: widget.x,
                  y: widget.y,
                  width: widget.width,
                  height: widget.height,
                });
            const basePixels = gridToPixels(baseGrid);

            return {
              ...widget,
              x: basePixels.x,
              y: basePixels.y,
              width: basePixels.width,
              height: basePixels.height,
              col: baseGrid.col,
              row: baseGrid.row,
              w: baseGrid.w,
              h: baseGrid.h,
              component: component,
              locked: widget.locked || false,
              pinned: widget.pinned || false,
              settings: widget.settings || {},
            };
          } catch (error) {
            console.error(`Error restoring widget ${widget.id}:`, error);
            return null;
          }
        })
        .filter((widget) => widget !== null);

      // Ensure back button exists and is locked
      const hasBackButton = restoredWidgets.some((w) => w.id === "back-button");
      if (!hasBackButton) {
        const backButtonWidth = snapSizeToGrid(120);
        const backButtonHeight = snapSizeToGrid(60);
        const backButtonX = snapToGrid(
          GRID_OFFSET_X + centerOffset.x,
          GRID_OFFSET_X
        );
        const backButtonY = snapToGrid(
          GRID_OFFSET_Y + centerOffset.y,
          GRID_OFFSET_Y
        );

        restoredWidgets.unshift({
          id: "back-button",
          type: "back-button",
          x: backButtonX,
          y: backButtonY,
          width: backButtonWidth,
          height: backButtonHeight,
          component: () => <BackButtonWidget onBack={onBack} />,
          locked: true,
          pinned: false,
        });
      } else {
        const backButton = restoredWidgets.find((w) => w.id === "back-button");
        if (backButton) {
          backButton.locked = true;
          backButton.component = () => <BackButtonWidget onBack={onBack} />;
        }
      }

      // Use flushSync to ensure the state update happens synchronously
      flushSync(() => {
        setWidgets(restoredWidgets);
      });

      // Animate widgets in immediately after state update
      setTimeout(() => {
        animateWidgetsIn();
      }, 50);

      showToast("Layout reverted to default!");
      return;
    }

    // If no default layout, use hardcoded default layout
    if (
      DEFAULT_CV_DETAIL_LAYOUT &&
      Array.isArray(DEFAULT_CV_DETAIL_LAYOUT) &&
      DEFAULT_CV_DETAIL_LAYOUT.length > 0
    ) {
      const restoredWidgets = DEFAULT_CV_DETAIL_LAYOUT.map((widget) => {
        try {
          let component = null;
          if (widget.id === "back-button" || widget.type === "back-button") {
            component = () => <BackButtonWidget onBack={onBack} />;
          } else if (widget.id === "profile" || widget.type === "profile") {
            component = ProfileWidget;
          } else if (
            widget.id === "profile-picture" ||
            widget.type === "profile-picture"
          ) {
            component = ProfilePictureWidget;
          } else if (
            widget.id === "experience" ||
            widget.type === "experience"
          ) {
            component = ExperienceWidget;
          } else if (widget.id === "education" || widget.type === "education") {
            component = EducationWidget;
          } else if (widget.id === "projects" || widget.type === "projects") {
            component = ProjectsWidget;
          } else if (
            widget.id === "technical-skills" ||
            widget.type === "technical-skills"
          ) {
            component = TechnicalSkillsWidget;
          } else if (widget.id === "languages" || widget.type === "languages") {
            component = LanguagesWidget;
          } else if (
            widget.id === "certifications" ||
            widget.type === "certifications"
          ) {
            component = CertificationsWidget;
          }

          if (!component) {
            console.warn(
              `Widget component not found for type: ${widget.type}, id: ${widget.id}`
            );
            return null;
          }

          let settings = widget.settings || {};
          const hasGridUnits =
            typeof widget.col === "number" && typeof widget.row === "number";
          const baseGrid = hasGridUnits
            ? { col: widget.col, row: widget.row, w: widget.w, h: widget.h }
            : pixelsToGrid({
                x: widget.x,
                y: widget.y,
                width: widget.width,
                height: widget.height,
              });
          const basePixels = gridToPixels(baseGrid);

          return {
            ...widget,
            x: basePixels.x,
            y: basePixels.y,
            width: basePixels.width,
            height: basePixels.height,
            col: baseGrid.col,
            row: baseGrid.row,
            w: baseGrid.w,
            h: baseGrid.h,
            component: component,
            locked: widget.locked || false,
            pinned: widget.pinned || false,
            settings: Object.keys(settings).length > 0 ? settings : undefined,
          };
        } catch (error) {
          console.error(`Error restoring widget ${widget.id}:`, error);
          return null;
        }
      }).filter((widget) => widget !== null);

      // Ensure back button exists and is locked
      const hasBackButton = restoredWidgets.some((w) => w.id === "back-button");
      if (!hasBackButton) {
        const backButtonWidth = snapSizeToGrid(120);
        const backButtonHeight = snapSizeToGrid(60);
        const backButtonX = snapToGrid(
          GRID_OFFSET_X + centerOffset.x,
          GRID_OFFSET_X
        );
        const backButtonY = snapToGrid(
          GRID_OFFSET_Y + centerOffset.y,
          GRID_OFFSET_Y
        );

        restoredWidgets.unshift({
          id: "back-button",
          type: "back-button",
          x: backButtonX,
          y: backButtonY,
          width: backButtonWidth,
          height: backButtonHeight,
          component: () => <BackButtonWidget onBack={onBack} />,
          locked: true,
          pinned: false,
        });
      } else {
        const backButton = restoredWidgets.find((w) => w.id === "back-button");
        if (backButton) {
          backButton.locked = true;
          backButton.component = () => <BackButtonWidget onBack={onBack} />;
        }
      }

      flushSync(() => {
        setWidgets(restoredWidgets);
      });

      setTimeout(() => {
        animateWidgetsIn();
      }, 50);

      showToast("Layout reverted to default!");
      return;
    }

    // Final fallback: just back button
    const backButtonWidth = snapSizeToGrid(120);
    const backButtonHeight = snapSizeToGrid(60);
    const backButtonX = snapToGrid(
      GRID_OFFSET_X + centerOffset.x,
      GRID_OFFSET_X
    );
    const backButtonY = snapToGrid(
      GRID_OFFSET_Y + centerOffset.y,
      GRID_OFFSET_Y
    );

    const defaultWidgets = [
      {
        id: "back-button",
        type: "back-button",
        x: backButtonX,
        y: backButtonY,
        width: backButtonWidth,
        height: backButtonHeight,
        component: () => <BackButtonWidget onBack={onBack} />,
        locked: true,
        pinned: false,
      },
    ];

    flushSync(() => {
      setWidgets(defaultWidgets);
    });

    setTimeout(() => {
      animateWidgetsIn();
    }, 50);

    showToast("Layout reverted to default!");
  }, [setWidgets, showToast, onBack, animateWidgetsIn, centerOffset]);

  const handleMouseDownWithContext = (e, id) => {
    if (e.button !== 2) {
      handleMouseDown(e, id);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    const target = e.target;
    let widgetElement = target.closest("[data-widget-id]");
    if (!widgetElement) {
      widgetElement = target.closest(".widget");
    }
    const widgetId = widgetElement?.getAttribute("data-widget-id") || null;
    openContextMenu(e, widgetId);
  };

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

  const mobile = isMobile();

  return (
    <div
      data-cv-page="true"
      style={{
        width: "100vw",
        height: mobile ? "auto" : "100vh",
        minHeight: mobile ? "100vh" : "auto",
        overflowX: "hidden",
        overflowY: mobile ? "auto" : "hidden",
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
        onRevertToDefault={revertToDefault}
        onClose={closeContextMenu}
        componentMap={cvDetailComponentMap}
      />

      <GridBackground
        centerOffset={centerOffset}
        view="cv-detail"
        showDebugOutline={showDebugOutline}
      />

      <GridMask
        widgets={widgets}
        centerOffset={centerOffset}
        isDragging={isDragging}
        isResizing={isResizing}
        dragStateRef={dragStateRef}
        view="cv-detail"
      />

      <WidgetContainer
        widgets={validWidgets}
        isDragging={isDragging}
        isResizing={isResizing}
        collisionWidgetId={collisionWidgetId}
        dragStateRef={dragStateRef}
        resizeStateRef={resizeStateRef}
        onMouseDown={handleMouseDownWithContext}
        centerOffset={centerOffset}
        onUpdateWidgetSettings={updateWidgetSettings}
      />
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
