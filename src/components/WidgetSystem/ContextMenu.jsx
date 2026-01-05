import { componentMap as defaultComponentMap } from "../../hooks/useWidgets";
import { getWidgetMeta } from "../../utils/widgets";
import { useEffect, useRef, useState } from "react";

/* eslint-disable react/prop-types */

// Pin Icon SVG Component
const PinIcon = ({ size = 16, color = "currentColor" }) => (
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
const LockIcon = ({ size = 16, color = "currentColor" }) => (
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

export default function ContextMenu({
  contextMenu,
  widgets,
  onToggleLock,
  onTogglePin,
  onRemoveWidget,
  onSort,
  onAddWidget,
  onCopyLayout,
  onClose,
  componentMap,
}) {
  const menuRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });

  // Use provided componentMap or fall back to default
  const activeComponentMap = componentMap || defaultComponentMap;

  useEffect(() => {
    if (!contextMenu) {
      setAdjustedPosition({ x: 0, y: 0 });
      return;
    }

    // Use requestAnimationFrame to ensure the menu is rendered before measuring
    const adjustPosition = () => {
      if (!menuRef.current) {
        requestAnimationFrame(adjustPosition);
        return;
      }

      const menu = menuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = contextMenu.x;
      let adjustedY = contextMenu.y;

      // Adjust horizontal position if menu would overflow right edge
      if (adjustedX + menuRect.width > viewportWidth) {
        adjustedX = Math.max(8, viewportWidth - menuRect.width - 8); // 8px padding from edge
      }

      // Adjust horizontal position if menu would overflow left edge
      if (adjustedX < 0) {
        adjustedX = 8; // 8px padding from edge
      }

      // Adjust vertical position if menu would overflow bottom edge
      if (adjustedY + menuRect.height > viewportHeight) {
        adjustedY = Math.max(8, viewportHeight - menuRect.height - 8); // 8px padding from edge
      }

      // Adjust vertical position if menu would overflow top edge
      if (adjustedY < 0) {
        adjustedY = 8; // 8px padding from edge
      }

      setAdjustedPosition({ x: adjustedX, y: adjustedY });
    };

    // Small delay to ensure menu is rendered
    requestAnimationFrame(adjustPosition);
  }, [contextMenu]);

  if (!contextMenu) return null;

  const widget = contextMenu.widgetId
    ? widgets.find((w) => w.id === contextMenu.widgetId)
    : null;

  // Get available widget types
  const availableWidgetTypes = Object.keys(activeComponentMap);

  // Widgets that allow multiple instances
  const allowsMultipleInstances = (type) => type === "single-game";

  // Get widgets currently on the grid
  const existingWidgetTypes = new Set(widgets.map((w) => w.type || w.id));

  // Find missing widgets (or widgets that allow multiple instances)
  // Exclude back-button from add menu as it's automatically added
  const missingWidgets = availableWidgetTypes
    .filter((type) => {
      // Exclude back-button from manual addition
      if (type === "back-button") return false;
      return allowsMultipleInstances(type) || !existingWidgetTypes.has(type);
    })
    .map((type) => {
      const meta = getWidgetMeta(type, activeComponentMap[type]);
      return {
        type,
        name: meta.name,
        icon: meta.icon,
      };
    });

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: "fixed",
        zIndex: 1001,
        background: "color-mix(in hsl, hsl(0 0% 4%), transparent 5%)",
        border: "1px solid color-mix(in hsl, canvasText, transparent 10%)",
        borderRadius: "4px",
        padding: "0.25rem 0",
        width: "max-content",
        maxWidth: "220px",
        boxShadow: "0 4px 12px color-mix(in hsl, canvasText, transparent 95%)",
        backdropFilter: "blur(10px)",
        left: `${adjustedPosition.x || contextMenu.x}px`,
        top: `${adjustedPosition.y || contextMenu.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {widget && (
        <>
          <button
            style={{
              width: "100%",
              padding: "0.5rem 1rem",
              background: "none",
              border: "none",
              color: "canvasText",
              fontSize: "0.875rem",
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.2s",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              whiteSpace: "nowrap",
            }}
            onClick={() => {
              onTogglePin(contextMenu.widgetId);
              onClose();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "color-mix(in hsl, canvasText, transparent 90%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            <PinIcon size={16} />
            <span>{widget.pinned ? "Unpin" : "Pin"}</span>
          </button>
          <button
            style={{
              width: "100%",
              padding: "0.5rem 1rem",
              background: "none",
              border: "none",
              color: "canvasText",
              fontSize: "0.875rem",
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.2s",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              whiteSpace: "nowrap",
            }}
            onClick={() => {
              onToggleLock(contextMenu.widgetId);
              onClose();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "color-mix(in hsl, canvasText, transparent 90%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            <LockIcon size={16} />
            <span>{widget.locked ? "Unlock" : "Lock"}</span>
          </button>
          <div
            style={{
              height: "1px",
              background: "color-mix(in hsl, canvasText, transparent 10%)",
              margin: "0.25rem 0",
            }}
          ></div>
          <button
            style={{
              width: "100%",
              padding: "0.5rem 1rem",
              background: "none",
              border: "none",
              color: "#ff6b6b",
              fontSize: "0.875rem",
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.2s",
              fontFamily: "inherit",
            }}
            onClick={() => {
              onRemoveWidget(contextMenu.widgetId);
              onClose();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "color-mix(in hsl, #ff6b6b, transparent 90%)";
              e.currentTarget.style.color = "#ff6b6b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "#ff6b6b";
            }}
          >
            🗑️ Remove
          </button>
        </>
      )}
      {missingWidgets.length > 0 && (
        <>
          {widget && <div className="context-menu-divider"></div>}
          <div
            style={{
              padding: "0.375rem 1rem",
              fontSize: "0.75rem",
              color: "canvasText",
              opacity: 0.5,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 600,
            }}
          >
            Add Widget
          </div>
          {missingWidgets.map(({ type, name, icon }) => (
            <button
              key={type}
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                background: "none",
                border: "none",
                color: "canvasText",
                fontSize: "0.875rem",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 0.2s",
                fontFamily: "inherit",
              }}
              onClick={() => {
                onAddWidget(type, contextMenu.x, contextMenu.y);
                onClose();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "color-mix(in hsl, canvasText, transparent 90%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              {icon} {name}
            </button>
          ))}
          <div
            style={{
              height: "1px",
              background: "color-mix(in hsl, canvasText, transparent 10%)",
              margin: "0.25rem 0",
            }}
          ></div>
        </>
      )}
      {widget && missingWidgets.length === 0 && (
        <div
          style={{
            height: "1px",
            background: "color-mix(in hsl, canvasText, transparent 10%)",
            margin: "0.25rem 0",
          }}
        ></div>
      )}
      <button
        style={{
          width: "100%",
          padding: "0.5rem 1rem",
          background: "none",
          border: "none",
          color: "canvasText",
          fontSize: "0.875rem",
          textAlign: "left",
          cursor: "pointer",
          transition: "background 0.2s",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
        onClick={() => {
          onSort();
          onClose();
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "color-mix(in hsl, canvasText, transparent 90%)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
        }}
      >
        ↻ Sort
      </button>
      <div
        style={{
          height: "1px",
          background: "color-mix(in hsl, canvasText, transparent 10%)",
          margin: "0.25rem 0",
        }}
      ></div>
      <button
        style={{
          width: "100%",
          padding: "0.5rem 1rem",
          background: "none",
          border: "none",
          color: "canvasText",
          fontSize: "0.875rem",
          textAlign: "left",
          cursor: "pointer",
          transition: "background 0.2s",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          whiteSpace: "nowrap",
        }}
        onClick={() => {
          if (onCopyLayout) {
            onCopyLayout();
          }
          onClose();
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "color-mix(in hsl, canvasText, transparent 90%)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
        }}
      >
        Copy Layout
      </button>
      {/* <button
        style={{
          width: '100%',
          padding: '0.5rem 1rem',
          background: 'none',
          border: 'none',
          color: 'canvasText',
          fontSize: '0.875rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.2s',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
        onClick={() => {
          if (onRevertToDefault) {
            onRevertToDefault()
          }
          onClose()
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'color-mix(in hsl, canvasText, transparent 90%)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none'
        }}
      >
        ↺ Revert to Default
      </button> */}
    </div>
  );
}
