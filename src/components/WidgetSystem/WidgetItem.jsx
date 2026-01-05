import { Component, useEffect, useRef } from "react";
import { isMobile } from "../../utils/mobile";
import { isDevMode } from "../../utils/devMode";

/* eslint-disable react/prop-types */

// Pin Icon SVG Component
const PinIcon = ({ size = 12, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20.1689 23.1693C19.5514 23.7703 19.2153 24.5815 19.2153 25.4473C19.2153 26.3132 19.5514 27.1244 20.1689 27.7254L17.6606 30.2335L10.9669 23.5236L2.50829 32L0 29.4918L8.47682 21.0337L1.76657 14.3403L4.27486 11.8322C5.4934 13.0506 7.61261 13.0506 8.83115 11.8322L20.6805 0L32 11.3189L20.1672 23.1676L20.1689 23.1693Z"
      fill={color}
    />
  </svg>
);

// Lock Icon SVG Component
const LockIcon = ({ size = 12, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 27 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.5 0C8.5275 0 4.5 4.09143 4.5 9.14286V13.7143H0V32H27V13.7143H22.5V9.14286C22.5 4.09143 18.4725 0 13.5 0ZM13.5 4.57143C16.1775 4.57143 18 6.42286 18 9.14286V13.7143H9V9.14286C9 6.42286 10.8225 4.57143 13.5 4.57143Z"
      fill={color}
    />
  </svg>
);

// Error boundary component for individual widgets
class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Widget error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "1rem",
            color: "var(--color-canvas-text, #ffffff)",
            opacity: 0.6,
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            textAlign: "center",
          }}
        >
          Widget unavailable
        </div>
      );
    }

    return this.props.children;
  }
}

export default function WidgetItem({
  widget,
  allWidgets,
  isDragging,
  isResizing,
  hasCollision,
  isSwapTarget,
  isDraggingOverSwapTarget,
  onMouseDown,
  wasLastInteractionDrag,
  onGameClick,
  onCVClick,
  onUpdateWidgetSettings,
}) {
  const widgetRef = useRef(null);
  const hasBeenAnimatedRef = useRef(false);
  const handleRefs = useRef({});
  const mouseRef = useRef({ x: 0, y: 0, has: false });
  const rafRef = useRef(null);
  const resetHandlesRef = useRef(null);

  // Add animation styles once
  useEffect(() => {
    if (!document.getElementById("widget-item-styles")) {
      const style = document.createElement("style");
      style.id = "widget-item-styles";
      style.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        body.layout-mode .widget {
          cursor: move;
        }
        body.layout-mode .widget * {
          cursor: move;
        }
        body.layout-mode .widget[data-locked="true"],
        body.layout-mode .widget[data-locked="true"] * {
          cursor: not-allowed;
        }
        body.layout-mode iframe {
          pointer-events: none;
          cursor: move;
        }
        body:not(.layout-mode) [data-handle] {
          display: none !important;
        }
        body.layout-mode [data-handle] {
          display: block !important;
        }
        /* Widgets start with initial transform for GSAP animations */
        [data-widget-id] {
          transform-origin: center center;
          will-change: opacity, transform;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Mark widget as animated once GSAP has animated it in
  useEffect(() => {
    if (widgetRef.current && !hasBeenAnimatedRef.current) {
      const checkInterval = setInterval(() => {
        const element = widgetRef.current;
        if (element) {
          const opacity = window.getComputedStyle(element).opacity;
          if (opacity === "1" || parseFloat(opacity) > 0.9) {
            hasBeenAnimatedRef.current = true;
            clearInterval(checkInterval);
          }
        }
      }, 100);

      // Clear after 2 seconds max
      setTimeout(() => clearInterval(checkInterval), 2000);
    }
  }, []);

  useEffect(() => {
    const resetHandleVisibility = () => {
      const handles = handleRefs.current;
      Object.values(handles).forEach((handleEl) => {
        if (!handleEl) {
          return;
        }
        handleEl.style.opacity = "0";
        handleEl.style.transform = "scale(0.6)";
        handleEl.style.filter = "none";
      });
    };

    resetHandlesRef.current = resetHandleVisibility;

    const updateHandleVisibility = () => {
      rafRef.current = null;
      const widgetEl = widgetRef.current;
      if (!widgetEl || widget.locked) {
        return;
      }

      const isLayoutMode = document.body.classList.contains("layout-mode");
      const rect = widgetEl.getBoundingClientRect();
      const points = {
        n: { x: rect.left + rect.width / 2, y: rect.top },
        s: { x: rect.left + rect.width / 2, y: rect.bottom },
        e: { x: rect.right, y: rect.top + rect.height / 2 },
        w: { x: rect.left, y: rect.top + rect.height / 2 },
        ne: { x: rect.right, y: rect.top },
        nw: { x: rect.left, y: rect.top },
        se: { x: rect.right, y: rect.bottom },
        sw: { x: rect.left, y: rect.bottom },
      };

      const maxDistance = 170;
      const { x, y, has } = mouseRef.current;

      Object.entries(points).forEach(([direction, point]) => {
        const handleEl = handleRefs.current[direction];
        if (!handleEl) {
          return;
        }

        if (!isLayoutMode || !has) {
          handleEl.style.opacity = "0";
          handleEl.style.transform = "scale(0.6)";
          handleEl.style.filter = "none";
          return;
        }

        const distance = Math.hypot(point.x - x, point.y - y);
        const t = Math.max(0, Math.min(1, 1 - distance / maxDistance));
        const eased = Math.pow(t, 0.7);
        const opacity = (0.95 * eased).toFixed(3);
        const scale = (0.7 + 0.3 * eased).toFixed(3);

        handleEl.style.opacity = opacity;
        handleEl.style.transform = `scale(${scale})`;
        handleEl.style.filter =
          eased > 0.15
            ? "drop-shadow(0 4px 10px rgba(255, 255, 255, 0.25))"
            : "none";
      });
    };

    const handleMouseMove = (event) => {
      mouseRef.current = { x: event.clientX, y: event.clientY, has: true };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateHandleVisibility);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", resetHandleVisibility);
    window.addEventListener("pointerup", resetHandleVisibility);
    window.addEventListener("touchend", resetHandleVisibility);
    window.addEventListener("blur", resetHandleVisibility);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", resetHandleVisibility);
      window.removeEventListener("pointerup", resetHandleVisibility);
      window.removeEventListener("touchend", resetHandleVisibility);
      window.removeEventListener("blur", resetHandleVisibility);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [widget.locked, isDragging, isResizing]);

  useEffect(() => {
    if (!isResizing && resetHandlesRef.current) {
      resetHandlesRef.current();
    }
  }, [isResizing]);

  const getWidgetStyle = () => {
    const baseStyle = {
      position: "absolute",
      background: "hsl(0 0% 4%)",
      border: hasCollision
        ? "2px solid #ff4444"
        : isSwapTarget
        ? "1px solid rgba(74, 158, 255, 0.3)"
        : widget.pinned
        ? "1px solid rgba(255, 255, 255, 0.45)"
        : "1px solid #777777",
      borderRadius: "4px",
      overflow: "visible",
      transition:
        isDragging || isResizing
          ? "none"
          : "border-color 0.2s ease, box-shadow 0.2s ease, left 0.4s cubic-bezier(0.4, 0, 0.2, 1), top 0.4s cubic-bezier(0.4, 0, 0.2, 1), width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      // Disable CSS transitions for opacity/transform during GSAP animations
      willChange: isDragging || isResizing ? "auto" : "opacity, transform",
      cursor: widget.locked ? "not-allowed" : "default",
      userSelect: "none",
      boxShadow: "none",
      left: `${widget.x}px`,
      top: `${widget.y}px`,
      width: `${widget.width}px`,
      height: `${widget.height}px`,
      zIndex: isDragging || isResizing ? 1000 : isSwapTarget ? 1001 : "auto",
      // Start invisible only if not already animated (prevents flash on new widgets)
      // Dim the dragged widget when hovering over a swap target
      opacity: hasBeenAnimatedRef.current
        ? isDraggingOverSwapTarget
          ? 0.4
          : widget.locked
          ? 0.85
          : 1
        : 0,
      visibility: hasBeenAnimatedRef.current ? "visible" : "hidden",
      transform: hasBeenAnimatedRef.current
        ? "scale(1) translateY(0)"
        : "scale(0.8) translateY(20px)",
    };

    if (hasCollision) {
      baseStyle.animation = "shake 0.3s ease-in-out";
    }

    return baseStyle;
  };

  const getWidgetContentStyle = () => ({
    overflow: "hidden",
    borderRadius: "8px",
    height: "100%",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  });

  const getResizeHandleStyle = (direction) => {
    const baseHandleStyle = {
      position: "absolute",
      zIndex: 10,
      opacity: 0,
      transform: "scale(0.6)",
      transition:
        "opacity 0.1s ease-out, transform 0.1s ease-out, filter 0.1s ease-out",
      pointerEvents: "all",
      background: "transparent",
      cursor: "default",
      display: widget.locked || (isMobile() && !isDevMode()) ? "none" : "block",
    };

    // Handle indicator rendered via span
    const handleStyles = {
      n: {
        ...baseHandleStyle,
        top: "-26px",
        left: 0,
        right: 0,
        height: "52px",
        width: "100%",
        cursor: "ns-resize",
      },
      s: {
        ...baseHandleStyle,
        bottom: "-26px",
        left: 0,
        right: 0,
        height: "52px",
        width: "100%",
        cursor: "ns-resize",
      },
      e: {
        ...baseHandleStyle,
        right: "-26px",
        top: 0,
        bottom: 0,
        width: "52px",
        height: "100%",
        cursor: "ew-resize",
      },
      w: {
        ...baseHandleStyle,
        left: "-26px",
        top: 0,
        bottom: 0,
        width: "52px",
        height: "100%",
        cursor: "ew-resize",
      },
      ne: {
        ...baseHandleStyle,
        top: "-26px",
        right: "-26px",
        width: "52px",
        height: "52px",
        cursor: "nesw-resize",
      },
      nw: {
        ...baseHandleStyle,
        top: "-26px",
        left: "-26px",
        width: "52px",
        height: "52px",
        cursor: "nwse-resize",
      },
      se: {
        ...baseHandleStyle,
        bottom: "-26px",
        right: "-26px",
        width: "52px",
        height: "52px",
        cursor: "nwse-resize",
      },
      sw: {
        ...baseHandleStyle,
        bottom: "-26px",
        left: "-26px",
        width: "52px",
        height: "52px",
        cursor: "nesw-resize",
      },
    };

    return handleStyles[direction] || baseHandleStyle;
  };

  const getHandleIndicatorStyle = (direction) => {
    const baseIndicatorStyle = {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.35))",
      border: "1px solid rgba(255, 255, 255, 0.55)",
      boxShadow:
        "0 6px 18px rgba(0, 0, 0, 0.35), 0 0 12px rgba(255, 255, 255, 0.25)",
      transition: "transform 0.1s ease-out",
      pointerEvents: "none",
    };

    if (direction === "n" || direction === "s") {
      return {
        ...baseIndicatorStyle,
        width: "33%",
        height: "6px",
        background: "rgba(255, 255, 255, 0.95)",
        border: "none",
        borderRadius: "999px",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
      };
    }

    if (direction === "e" || direction === "w") {
      return {
        ...baseIndicatorStyle,
        width: "6px",
        height: "33%",
        background: "rgba(255, 255, 255, 0.95)",
        border: "none",
        borderRadius: "999px",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
      };
    }

    const cornerBase = {
      ...baseIndicatorStyle,
      width: "24px",
      height: "24px",
      background: "transparent",
      border: "6px solid rgba(255, 255, 255, 0.9)",
      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
      transform: "translate(-50%, -50%)",
    };

    if (direction === "ne") {
      return {
        ...cornerBase,
        borderLeft: "none",
        borderBottom: "none",
        borderTopRightRadius: "6px",
        transform: "translate(-50%, -50%) translate(-8px, 8px)",
      };
    }
    if (direction === "nw") {
      return {
        ...cornerBase,
        borderRight: "none",
        borderBottom: "none",
        borderTopLeftRadius: "6px",
        transform: "translate(-50%, -50%) translate(8px, 8px)",
      };
    }
    if (direction === "se") {
      return {
        ...cornerBase,
        borderLeft: "none",
        borderTop: "none",
        borderBottomRightRadius: "6px",
        transform: "translate(-50%, -50%) translate(-8px, -8px)",
      };
    }

    return {
      ...cornerBase,
      borderRight: "none",
      borderTop: "none",
      borderBottomLeftRadius: "6px",
      transform: "translate(-50%, -50%) translate(8px, -8px)",
    };
  };

  const handleMouseEnter = (e) => {
    if (!widget.locked && !isDragging && !isResizing) {
      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.9)";
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 255, 255, 0.05)";
    }
  };

  const handleMouseLeave = (e) => {
    if (!widget.locked && !isDragging && !isResizing) {
      e.currentTarget.style.borderColor = widget.pinned
        ? "rgba(255, 255, 255, 0.45)"
        : "#777777";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }
  };

  const handleClick = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Prevent default behavior to avoid page reloads when clicking on widget container
    // Only prevent if NOT clicking on interactive elements (links, buttons, etc.)
    const isInteractiveElement = e.target.closest(
      'a, button, input, select, textarea, [role="button"]'
    );
    if (!isInteractiveElement) {
      e.preventDefault();
    }
  };

  // Handle missing component gracefully
  if (!widget.component) {
    return (
      <div
        className="widget"
        style={getWidgetStyle()}
        data-widget-id={widget.id}
        onMouseDown={(e) => {
          if (!widget.locked) {
            onMouseDown(e, widget.id);
          }
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={getWidgetContentStyle()}>
          <div
            style={{
              padding: "1rem",
              color: "var(--color-canvas-text, #ffffff)",
              opacity: 0.6,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              textAlign: "center",
            }}
          >
            Widget component not found
          </div>
        </div>
      </div>
    );
  }

  const Component = widget.component;

  return (
    <div
      ref={widgetRef}
      className="widget"
      style={getWidgetStyle()}
      data-locked={widget.locked ? "true" : "false"}
      data-widget-id={widget.id}
      onMouseDownCapture={(e) => {
        if (e.ctrlKey && !widget.locked) {
          onMouseDown(e, widget.id);
          e.currentTarget.style.cursor = "grabbing";
        }
      }}
      onClickCapture={(e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onMouseDown={(e) => {
        // Don't start dragging if clicking on interactive elements or images
        const isInteractiveElement = e.target.closest(
          'input, textarea, select, button, a, [role="button"], [contenteditable="true"], img'
        );
        if (e.ctrlKey) {
          if (!widget.locked) {
            onMouseDown(e, widget.id);
          }
          return;
        }
        if (!widget.locked && !isInteractiveElement) {
          onMouseDown(e, widget.id);
        }
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {widget.locked && (
        <div
          style={{
            position: "absolute",
            right: "4px",
            opacity: 0.6,
            pointerEvents: "none",
            zIndex: 1,
            color: "var(--color-canvas-text, #ffffff)",
          }}
        >
          <LockIcon size={12} />
        </div>
      )}
      {widget.pinned && !widget.locked && (
        <div
          style={{
            position: "absolute",
            right: "4px",
            opacity: 0.6,
            pointerEvents: "none",
            zIndex: 1,
            color: "var(--color-canvas-text, #ffffff)",
          }}
        >
          <PinIcon size={12} />
        </div>
      )}
      {isSwapTarget && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            borderRadius: "4px",
            pointerEvents: "none",
            zIndex: 1002,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: "1.25rem",
            fontWeight: 500,
            letterSpacing: "0.05em",
          }}
        >
          SWAP
        </div>
      )}
      <div style={getWidgetContentStyle()}>
        <WidgetErrorBoundary>
          <Component
            widgetId={widget.id}
            wasLastInteractionDrag={wasLastInteractionDrag}
            onGameClick={onGameClick}
            onCVClick={onCVClick}
            widget={{
              ...widget,
              onSettingsChange: onUpdateWidgetSettings
                ? (settings) => onUpdateWidgetSettings(widget.id, settings)
                : undefined,
            }}
            allWidgets={allWidgets}
          />
        </WidgetErrorBoundary>
      </div>
      {/* Resize handles */}
      {["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((direction) => (
        <div
          key={direction}
          style={getResizeHandleStyle(direction)}
          data-handle={direction}
          ref={(el) => {
            handleRefs.current[direction] = el;
          }}
        >
          <span style={getHandleIndicatorStyle(direction)}></span>
        </div>
      ))}
    </div>
  );
}
