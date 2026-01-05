import { useState, useRef, useCallback, useEffect } from "react";
import {
  snapToGrid,
  snapSizeToGrid,
  constrainToViewport,
  constrainSizeToViewport,
  snapToGridConstrained,
  isWithinUsableArea,
} from "../utils/grid";
import { getWidgetMinSize } from "../constants/grid";
import { GRID_OFFSET_X, GRID_OFFSET_Y } from "../constants/grid";
import { isMobile } from "../utils/mobile";
import { isDevMode } from "../utils/devMode";
import {
  hasCollisionWithOthers,
  findNearestValidPosition,
  findValidSize,
  findWidgetAtPoint,
  findCollidingWidget,
} from "../utils/collision";

export const useDragAndResize = (
  widgets,
  setWidgets,
  centerOffset = { x: 0, y: 0 },
  view = "main"
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [collisionWidgetId, setCollisionWidgetId] = useState(null);
  const [swapTargetId, setSwapTargetId] = useState(null);
  const swapTimerRef = useRef(null);
  const handleMouseUpRef = useRef(null);
  const dragStateRef = useRef({
    activeId: null,
    startX: 0,
    startY: 0,
    widgetStartX: 0,
    widgetStartY: 0,
    widgetStartWidth: 0,
    widgetStartHeight: 0,
    hasMoved: false, // Track if mouse actually moved (drag vs click)
    moveThreshold: 5, // Pixels to move before considering it a drag
  });
  const resizeStateRef = useRef({
    activeId: null,
    handle: null, // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
    startX: 0,
    startY: 0,
    widgetStartX: 0,
    widgetStartY: 0,
    widgetStartWidth: 0,
    widgetStartHeight: 0,
  });

  const handleMouseDown = (e, id) => {
    if (e.button !== 0) return;

    // Disable all widget interactions on mobile (unless in dev mode)
    if (isMobile() && !isDevMode()) return;
    if (!e.ctrlKey) return;

    const widget = widgets.find((w) => w.id === id);
    if (!widget) return;

    // Don't allow dragging/resizing locked widgets
    if (widget.locked) return;

    // Check if clicking on a resize handle
    const handle = e.target.dataset.handle;
    if (handle) {
      resizeStateRef.current = {
        activeId: id,
        handle: handle,
        startX: e.clientX,
        startY: e.clientY,
        widgetStartX: widget.x,
        widgetStartY: widget.y,
        widgetStartWidth: widget.width,
        widgetStartHeight: widget.height,
      };
      setIsResizing(true);
    } else {
      dragStateRef.current = {
        activeId: id,
        startX: e.clientX,
        startY: e.clientY,
        widgetStartX: widget.x,
        widgetStartY: widget.y,
        widgetStartWidth: widget.width,
        widgetStartHeight: widget.height,
        hasMoved: false,
        moveThreshold: 5,
      };
      setIsDragging(true);
    }

    e.preventDefault();
    e.stopPropagation();
  };

  // Helper function to perform widget swap
  const performSwap = useCallback(
    (activeId, targetId) => {
      setWidgets((prev) => {
        const activeWidget = prev.find((w) => w.id === activeId);
        const targetWidget = prev.find((w) => w.id === targetId);

        if (!activeWidget || !targetWidget) return prev;
        if (activeWidget.locked || targetWidget.locked) return prev;

        // Get the dragged widget's original position and size (where it started)
        const draggedOriginalX = dragStateRef.current.widgetstartX;
        const draggedOriginalY = dragStateRef.current.widgetstartY;
        const draggedOriginalWidth = dragStateRef.current.widgetstartWidth;
        const draggedOriginalHeight = dragStateRef.current.widgetstartHeight;

        // Snap the dragged widget's original position and size
        const draggedSnappedX = snapToGrid(draggedOriginalX, GRID_OFFSET_X);
        const draggedSnappedY = snapToGrid(draggedOriginalY, GRID_OFFSET_Y);
        const draggedSnappedWidth = snapSizeToGrid(draggedOriginalWidth);
        const draggedSnappedHeight = snapSizeToGrid(draggedOriginalHeight);

        // Get the target widget's current position and size
        const targetSnappedX = snapToGrid(targetWidget.x, GRID_OFFSET_X);
        const targetSnappedY = snapToGrid(targetWidget.y, GRID_OFFSET_Y);
        const targetSnappedWidth = snapSizeToGrid(targetWidget.width);
        const targetSnappedHeight = snapSizeToGrid(targetWidget.height);

        const swappedWidgets = prev.map((w) => {
          if (w.id === activeId) {
            // Move dragged widget to target widget's position and size
            return {
              ...w,
              x: targetSnappedX,
              y: targetSnappedY,
              width: targetSnappedWidth,
              height: targetSnappedHeight,
            };
          } else if (w.id === targetId) {
            // Move target widget to dragged widget's original position and size
            return {
              ...w,
              x: draggedSnappedX,
              y: draggedSnappedY,
              width: draggedSnappedWidth,
              height: draggedSnappedHeight,
            };
          }
          return w;
        });

        // Show collision feedback
        setCollisionWidgetId(activeId);
        setTimeout(() => setCollisionWidgetId(null), 300);

        // Mark both widgets as having been dragged to prevent click events
        dragStateRef.current.lastWasDrag = true;
        dragStateRef.current.lastWidgetId = activeId;
        // Also mark the target widget to prevent its click handler from firing
        dragStateRef.current.swappedTargetId = targetId;

        return swappedWidgets;
      });

      // Clear swap target and stop dragging (only if called from timer)
      setSwapTargetId(null);
      setIsDragging(false);
      dragStateRef.current.activeId = null;
      dragStateRef.current.hasMoved = false;

      // Clear swapped target ID after a short delay to allow click handlers to check it
      setTimeout(() => {
        dragStateRef.current.swappedTargetId = null;
      }, 100);
    },
    [setWidgets]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (
        (dragStateRef.current.activeId || resizeStateRef.current.activeId) &&
        e.buttons === 0
      ) {
        if (handleMouseUpRef.current) {
          handleMouseUpRef.current();
        }
        return;
      }
      // Track if dragging has actually moved (for click vs drag detection)
      if (dragStateRef.current.activeId) {
        const deltaX = Math.abs(e.clientX - dragStateRef.current.startX);
        const deltaY = Math.abs(e.clientY - dragStateRef.current.startY);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > dragStateRef.current.moveThreshold) {
          dragStateRef.current.hasMoved = true;
        }
      }

      // Handle resizing - allow free movement during resize
      if (resizeStateRef.current.activeId) {
        const {
          handle,
          startX,
          startY,
          widgetStartX,
          widgetStartY,
          widgetStartWidth,
          widgetStartHeight,
        } = resizeStateRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        setWidgets((prev) => {
          const activeWidget = prev.find(
            (w) => w.id === resizeStateRef.current.activeId
          );
          if (!activeWidget) return prev;

          let newX = widgetStartX;
          let newY = widgetStartY;
          let newWidth = widgetStartWidth;
          let newHeight = widgetStartHeight;

          // Handle horizontal resizing
          if (handle.includes("e")) {
            newWidth = widgetStartWidth + deltaX;
          } else if (handle.includes("w")) {
            newWidth = widgetStartWidth - deltaX;
            newX = widgetStartX + deltaX;
          }

          // Handle vertical resizing
          if (handle.includes("s")) {
            newHeight = widgetStartHeight + deltaY;
          } else if (handle.includes("n")) {
            newHeight = widgetStartHeight - deltaY;
            newY = widgetStartY + deltaY;
          }

          // Allow resizing below minimum during drag - we'll validate on mouse up
          // Constrain size to viewport (no minimum enforced during resize)
          const constrainedSize = constrainSizeToViewport(
            newX,
            newY,
            newWidth,
            newHeight,
            0,
            0,
            centerOffset,
            view
          );
          newWidth = constrainedSize.width;
          newHeight = constrainedSize.height;

          // Constrain position to viewport (in case resize moved it out)
          const constrainedPos = constrainToViewport(
            newX,
            newY,
            newWidth,
            newHeight,
            centerOffset,
            true,
            view
          );
          newX = constrainedPos.x;
          newY = constrainedPos.y;

          // Allow free movement during resize - no collision checking
          return prev.map((w) =>
            w.id === activeWidget.id
              ? { ...w, x: newX, y: newY, width: newWidth, height: newHeight }
              : w
          );
        });
        return;
      }

      // Handle dragging - allow free movement (no constraints during drag)
      if (dragStateRef.current.activeId) {
        const { startX, startY, widgetStartX, widgetStartY } =
          dragStateRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        setWidgets((prev) => {
          const activeWidget = prev.find(
            (w) => w.id === dragStateRef.current.activeId
          );
          if (!activeWidget) return prev;

          // Allow free movement - no constraints during drag
          let newX = widgetStartX + deltaX;
          let newY = widgetStartY + deltaY;

          // Check which widget should be considered a swap target.
          // On mobile, rely on actual widget overlap to avoid false hits from scroll/viewport offsets.
          const hoveredWidget = isMobile()
            ? findCollidingWidget(
                {
                  x: newX,
                  y: newY,
                  width: activeWidget.width,
                  height: activeWidget.height,
                },
                prev,
                dragStateRef.current.activeId
              )
            : findWidgetAtPoint(
                e.clientX,
                e.clientY,
                prev,
                dragStateRef.current.activeId,
                centerOffset
              );

          // Clear existing timer
          if (swapTimerRef.current) {
            clearTimeout(swapTimerRef.current);
            swapTimerRef.current = null;
          }

          // Update swap target
          if (hoveredWidget && !hoveredWidget.locked && !activeWidget.locked) {
            // If hovering over a different widget, start timer
            if (swapTargetId !== hoveredWidget.id) {
              setSwapTargetId(hoveredWidget.id);
              // Start 1 second timer to auto-swap
              swapTimerRef.current = setTimeout(() => {
                performSwap(dragStateRef.current.activeId, hoveredWidget.id);
              }, 1000);
            }
          } else {
            // Not hovering over a swappable widget
            setSwapTargetId(null);
          }

          return prev.map((w) =>
            w.id === activeWidget.id ? { ...w, x: newX, y: newY } : w
          );
        });
      }
    },
    [setWidgets, centerOffset, swapTargetId, performSwap, view]
  );

  const handleMouseUp = useCallback(() => {
    // Clear swap timer
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }

    // Store swapTargetId before clearing it (we need it for the swap check)
    const currentSwapTargetId = swapTargetId;

    // Clear collision state and swap target
    setCollisionWidgetId(null);
    setSwapTargetId(null);

    // Handle resize end
    if (resizeStateRef.current.activeId) {
      const activeId = resizeStateRef.current.activeId;
      setIsResizing(false);

      // Snap widget position and size to grid
      setWidgets((prev) => {
        const widget = prev.find((w) => w.id === activeId);
        if (widget) {
          const {
            handle,
            widgetStartX,
            widgetStartY,
            widgetStartWidth,
            widgetStartHeight,
          } = resizeStateRef.current;
          const snappedWidth = snapSizeToGrid(widget.width);
          const snappedHeight = snapSizeToGrid(widget.height);

          // Calculate final position based on which handle was used
          let finalX = widget.x;
          let finalY = widget.y;

          if (handle.includes("w")) {
            // Resizing from left: adjust x position
            const widthChange = snappedWidth - widgetStartWidth;
            finalX = widgetStartX - widthChange;
          } else {
            // Resizing from right: keep x as is
            finalX = widget.x;
          }

          if (handle.includes("n")) {
            // Resizing from top: adjust y position
            const heightChange = snappedHeight - widgetStartHeight;
            finalY = widgetStartY - heightChange;
          } else {
            // Resizing from bottom: keep y as is
            finalY = widget.y;
          }

          // Snap final position to grid
          finalX = snapToGrid(finalX, GRID_OFFSET_X);
          finalY = snapToGrid(finalY, GRID_OFFSET_Y);

          // Get content-based minimum size for this widget type
          const minSize = getWidgetMinSize(widget.type || widget.id);
          const minWidth = snapSizeToGrid(minSize.width);
          const minHeight = snapSizeToGrid(minSize.height);

          // Check if size is below content-based minimum
          let needsSizeCorrection = false;
          let correctedWidth = snappedWidth;
          let correctedHeight = snappedHeight;

          if (snappedWidth < minWidth || snappedHeight < minHeight) {
            needsSizeCorrection = true;
            correctedWidth = Math.max(snappedWidth, minWidth);
            correctedHeight = Math.max(snappedHeight, minHeight);

            // Adjust position if resizing from left or top
            if (handle.includes("w")) {
              const widthChange = correctedWidth - snappedWidth;
              finalX = finalX - widthChange;
            }
            if (handle.includes("n")) {
              const heightChange = correctedHeight - snappedHeight;
              finalY = finalY - heightChange;
            }

            // Re-snap position after correction
            finalX = snapToGrid(finalX, GRID_OFFSET_X);
            finalY = snapToGrid(finalY, GRID_OFFSET_Y);
          }

          // Constrain size to viewport (with content-based minimum)
          const constrainedSize = constrainSizeToViewport(
            finalX,
            finalY,
            correctedWidth,
            correctedHeight,
            minWidth,
            minHeight,
            centerOffset,
            view
          );
          const finalWidth = constrainedSize.width;
          const finalHeight = constrainedSize.height;

          // Constrain position to viewport and ensure it's on grid
          // IMPORTANT: When resizing from bottom, preserve the top Y position - only constrain X
          // This prevents the widget from "jumping up" when trying to resize to the last row
          if (handle.includes("s") && !handle.includes("n")) {
            // Resizing from bottom only: keep Y fixed, only constrain X
            const snappedX = snapToGrid(finalX, GRID_OFFSET_X);
            const constrainedX = constrainToViewport(
              snappedX,
              finalY,
              finalWidth,
              finalHeight,
              centerOffset,
              true,
              view
            );
            finalX = constrainedX.x;
            // finalY stays as is (already snapped to grid) - never move widget up when resizing from bottom
          } else if (handle.includes("n") && !handle.includes("s")) {
            // Resizing from top only: constrain both X and Y
            const snappedPos = snapToGridConstrained(
              finalX,
              finalY,
              finalWidth,
              finalHeight,
              GRID_OFFSET_X,
              GRID_OFFSET_Y,
              centerOffset,
              view
            );
            finalX = snappedPos.x;
            finalY = snappedPos.y;
          } else {
            // Resizing from corners or sides: use standard constraint
            const snappedPos = snapToGridConstrained(
              finalX,
              finalY,
              finalWidth,
              finalHeight,
              GRID_OFFSET_X,
              GRID_OFFSET_Y,
              centerOffset,
              view
            );
            finalX = snappedPos.x;
            finalY = snappedPos.y;
          }

          // Show collision/shake animation if size was corrected
          if (needsSizeCorrection) {
            setCollisionWidgetId(activeId);
            setTimeout(() => setCollisionWidgetId(null), 300);
          }

          // Check for collisions and find valid size if needed
          const finalRect = {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
          };

          if (hasCollisionWithOthers(finalRect, prev, activeId)) {
            // Try to find a valid size (reduce if needed, but respect minimum)
            const validSize = findValidSize(
              finalX,
              finalY,
              finalWidth,
              finalHeight,
              prev,
              activeId,
              widgetStartWidth,
              widgetStartHeight,
              minWidth,
              minHeight
            );

            // Constrain valid size to viewport (with content-based minimum)
            const constrainedValidSize = constrainSizeToViewport(
              finalX,
              finalY,
              validSize.width,
              validSize.height,
              minWidth,
              minHeight,
              centerOffset,
              view
            );
            validSize.width = constrainedValidSize.width;
            validSize.height = constrainedValidSize.height;

            // Show collision feedback if size was reduced
            if (
              validSize.width !== finalWidth ||
              validSize.height !== finalHeight
            ) {
              setCollisionWidgetId(activeId);
              setTimeout(() => setCollisionWidgetId(null), 300);
            }

            // If size was reduced, recalculate position if needed
            let adjustedX = finalX;
            let adjustedY = finalY;

            if (handle.includes("w")) {
              const widthChange = validSize.width - widgetStartWidth;
              adjustedX = widgetStartX - widthChange;
              adjustedX = snapToGrid(adjustedX, GRID_OFFSET_X);
            }

            if (handle.includes("n")) {
              const heightChange = validSize.height - widgetStartHeight;
              adjustedY = widgetStartY - heightChange;
              adjustedY = snapToGrid(adjustedY, GRID_OFFSET_Y);
            }

            // Constrain adjusted position to viewport and ensure it's on grid
            // IMPORTANT: When resizing from bottom, preserve the top Y position
            if (handle.includes("s") && !handle.includes("n")) {
              // Resizing from bottom only: keep Y fixed, only constrain X
              const snappedX = snapToGrid(adjustedX, GRID_OFFSET_X);
              const constrainedX = constrainToViewport(
                snappedX,
                adjustedY,
                validSize.width,
                validSize.height,
                centerOffset,
                true,
                view
              );
              adjustedX = constrainedX.x;
              // adjustedY stays as is - never move widget up when resizing from bottom
            } else {
              const snappedAdjustedPos = snapToGridConstrained(
                adjustedX,
                adjustedY,
                validSize.width,
                validSize.height,
                GRID_OFFSET_X,
                GRID_OFFSET_Y,
                centerOffset,
                view
              );
              adjustedX = snappedAdjustedPos.x;
              adjustedY = snappedAdjustedPos.y;
            }

            // Check if adjusted position still has collision
            const adjustedRect = {
              x: adjustedX,
              y: adjustedY,
              width: validSize.width,
              height: validSize.height,
            };

            if (hasCollisionWithOthers(adjustedRect, prev, activeId)) {
              // Try to find nearest valid position
              const validPos = findNearestValidPosition(
                adjustedX,
                adjustedY,
                validSize.width,
                validSize.height,
                prev,
                activeId
              );

              // Show collision feedback if position was moved
              if (validPos.x !== adjustedX || validPos.y !== adjustedY) {
                setCollisionWidgetId(activeId);
                setTimeout(() => setCollisionWidgetId(null), 300);
              }

              return prev.map((w) => {
                if (w.id === activeId) {
                  return {
                    ...w,
                    x: validPos.x,
                    y: validPos.y,
                    width: validSize.width,
                    height: validSize.height,
                  };
                }
                return w;
              });
            }

            return prev.map((w) => {
              if (w.id === activeId) {
                return {
                  ...w,
                  x: adjustedX,
                  y: adjustedY,
                  width: validSize.width,
                  height: validSize.height,
                };
              }
              return w;
            });
          }

          return prev.map((w) => {
            if (w.id === activeId) {
              return {
                ...w,
                x: finalX,
                y: finalY,
                width: finalWidth,
                height: finalHeight,
              };
            }
            return w;
          });
        }
        return prev;
      });
      resizeStateRef.current.activeId = null;
    }

    // Handle drag end
    if (dragStateRef.current.activeId) {
      const activeId = dragStateRef.current.activeId;
      const wasDrag = dragStateRef.current.hasMoved;
      setIsDragging(false);

      // Only process position if it was actually a drag (not just a click)
      if (wasDrag) {
        // Snap the widget to the grid and check if it's within usable area
        setWidgets((prev) => {
          const widget = prev.find((w) => w.id === activeId);
          if (widget) {
            // Snap to grid first
            const snappedX = snapToGrid(widget.x, GRID_OFFSET_X);
            const snappedY = snapToGrid(widget.y, GRID_OFFSET_Y);

            // Check if widget is within usable area
            const withinArea = isWithinUsableArea(
              snappedX,
              snappedY,
              widget.width,
              widget.height,
              centerOffset,
              view
            );

            let finalX = snappedX;
            let finalY = snappedY;
            let shouldWiggle = false;

            if (!withinArea) {
              // Widget is outside usable area - constrain it back
              const constrained = constrainToViewport(
                snappedX,
                snappedY,
                widget.width,
                widget.height,
                centerOffset,
                true,
                view
              );
              finalX = constrained.x;
              finalY = constrained.y;
              shouldWiggle = true;
            }

            // Only swap if swapTargetId was set (cursor was over a widget with overlay showing)
            if (currentSwapTargetId) {
              const targetWidget = prev.find(
                (w) => w.id === currentSwapTargetId
              );
              if (targetWidget && !widget.locked && !targetWidget.locked) {
                // Perform swap inline (can't use performSwap here as it calls setWidgets)
                const draggedOriginalX = dragStateRef.current.widgetstartX;
                const draggedOriginalY = dragStateRef.current.widgetstartY;
                const draggedOriginalWidth =
                  dragStateRef.current.widgetstartWidth;
                const draggedOriginalHeight =
                  dragStateRef.current.widgetstartHeight;

                const draggedSnappedX = snapToGrid(
                  draggedOriginalX,
                  GRID_OFFSET_X
                );
                const draggedSnappedY = snapToGrid(
                  draggedOriginalY,
                  GRID_OFFSET_Y
                );
                const draggedSnappedWidth =
                  snapSizeToGrid(draggedOriginalWidth);
                const draggedSnappedHeight = snapSizeToGrid(
                  draggedOriginalHeight
                );

                const targetSnappedX = snapToGrid(
                  targetWidget.x,
                  GRID_OFFSET_X
                );
                const targetSnappedY = snapToGrid(
                  targetWidget.y,
                  GRID_OFFSET_Y
                );
                const targetSnappedWidth = snapSizeToGrid(targetWidget.width);
                const targetSnappedHeight = snapSizeToGrid(targetWidget.height);

                const swappedWidgets = prev.map((w) => {
                  if (w.id === activeId) {
                    return {
                      ...w,
                      x: targetSnappedX,
                      y: targetSnappedY,
                      width: targetSnappedWidth,
                      height: targetSnappedHeight,
                    };
                  } else if (w.id === currentSwapTargetId) {
                    return {
                      ...w,
                      x: draggedSnappedX,
                      y: draggedSnappedY,
                      width: draggedSnappedWidth,
                      height: draggedSnappedHeight,
                    };
                  }
                  return w;
                });

                setCollisionWidgetId(activeId);
                setTimeout(() => setCollisionWidgetId(null), 300);

                // Mark both widgets as having been dragged to prevent click events
                dragStateRef.current.lastWasDrag = true;
                dragStateRef.current.lastWidgetId = activeId;
                // Also mark the target widget to prevent its click handler from firing
                dragStateRef.current.swappedTargetId = currentSwapTargetId;

                return swappedWidgets;
              }
            }

            // Check for collisions with other widgets (but don't swap, just find valid position)
            const finalRect = {
              x: finalX,
              y: finalY,
              width: widget.width,
              height: widget.height,
            };

            if (hasCollisionWithOthers(finalRect, prev, activeId)) {
              // No direct collision found but hasCollisionWithOthers returned true
              // This shouldn't happen, but fallback to nearest valid position
              const validPos = findNearestValidPosition(
                finalX,
                finalY,
                widget.width,
                widget.height,
                prev,
                activeId
              );

              // Show collision feedback if position was moved
              if (validPos.x !== finalX || validPos.y !== finalY) {
                shouldWiggle = true;
              }

              finalX = validPos.x;
              finalY = validPos.y;
            }

            // Trigger wiggle if widget was moved back or had collision
            if (shouldWiggle) {
              setCollisionWidgetId(activeId);
              setTimeout(() => setCollisionWidgetId(null), 300);
            }

            return prev.map((w) => {
              if (w.id === activeId) {
                return {
                  ...w,
                  x: finalX,
                  y: finalY,
                };
              }
              return w;
            });
          }
          return prev;
        });
      }

      const widgetId = dragStateRef.current.activeId;
      dragStateRef.current.activeId = null;
      dragStateRef.current.hasMoved = false;

      // Store result for widgets to check
      dragStateRef.current.lastWasDrag = wasDrag;
      dragStateRef.current.lastWidgetId = widgetId;

      // Clear swapped target ID after a short delay to allow click handlers to check it
      if (dragStateRef.current.swappedTargetId) {
        setTimeout(() => {
          dragStateRef.current.swappedTargetId = null;
        }, 100);
      }
    }
  }, [centerOffset, setWidgets, swapTargetId, view]);

  useEffect(() => {
    handleMouseUpRef.current = handleMouseUp;
  }, [handleMouseUp]);

  useEffect(() => {
    const handleGlobalCancel = () => {
      if (handleMouseUpRef.current) {
        handleMouseUpRef.current();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleGlobalCancel();
      }
    };

    window.addEventListener("blur", handleGlobalCancel);
    window.addEventListener("mouseup", handleGlobalCancel);
    window.addEventListener("pointerup", handleGlobalCancel);
    window.addEventListener("pointercancel", handleGlobalCancel);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleGlobalCancel);
      window.removeEventListener("mouseup", handleGlobalCancel);
      window.removeEventListener("pointerup", handleGlobalCancel);
      window.removeEventListener("pointercancel", handleGlobalCancel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Helper to check if the last interaction was a drag
  const wasLastInteractionDrag = useCallback((widgetId) => {
    // Check if this widget was dragged
    const wasDragged =
      dragStateRef.current.lastWasDrag === true &&
      dragStateRef.current.lastWidgetId === widgetId;
    // Also check if this widget was the target of a swap (to prevent click events after swap)
    const wasSwapTarget = dragStateRef.current.swappedTargetId === widgetId;
    return wasDragged || wasSwapTarget;
  }, []);

  return {
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
  };
};
