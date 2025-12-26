import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../../constants/grid'
import { getRawUsableAreaBounds, getUsableGridWidth, getUsableGridHeight } from '../../utils/grid'
import { isMobile } from '../../utils/mobile'

/* eslint-disable react/prop-types */
export default function GridBackground({ centerOffset = { x: 0, y: 0 }, showDebugOutline = false }) {
  const size = 45
  const line = 'color-mix(in hsl, #ffffff, transparent 85%)'
  const lineSecondary = 'color-mix(in hsl, #808080, transparent 90%)'
  const mobile = isMobile()
  
  // Calculate the adjusted offset for the grid background
  // The grid offset is GRID_SIZE * 0.36 for X and GRID_SIZE * 0.32 for Y, and we add the center offset
  const adjustedOffsetX = size * 0.36 + (centerOffset.x || 0)
  const adjustedOffsetY = size * 0.32 + (centerOffset.y || 0)
  
  // Get the raw bounds of the usable area (single source of truth)
  const rawBounds = getRawUsableAreaBounds(centerOffset)
  const areaWidth = rawBounds.maxX - rawBounds.minX
  const areaHeight = rawBounds.maxY - rawBounds.minY
  
  // On mobile, extend the grid background to cover the full scrollable area
  const gridHeight = getUsableGridHeight()
  const backgroundHeight = mobile ? `${gridHeight * GRID_SIZE}px` : '100vh'
  
  return (
    <>
      <div 
        style={{
          '--size': `${size}px`,
          '--line': line,
          position: mobile ? 'absolute' : 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: backgroundHeight,
          background: `linear-gradient(90deg, var(--line) 1px, transparent 1px var(--size)) ${adjustedOffsetX}px 50% / var(--size) var(--size), linear-gradient(var(--line) 1px, transparent 1px var(--size)) 0% ${adjustedOffsetY}px / var(--size) var(--size)`,
          mask: 'linear-gradient(-20deg, transparent 50%, white)',
          pointerEvents: 'none',
          zIndex: -1
        }}
      ></div>
      <div 
        style={{
          '--size': `${size}px`,
          '--line': lineSecondary,
          position: mobile ? 'absolute' : 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: backgroundHeight,
          background: `linear-gradient(90deg, var(--line) 1px, transparent 1px var(--size)) ${adjustedOffsetX}px 50% / var(--size) var(--size), linear-gradient(var(--line) 1px, transparent 1px var(--size)) 0% ${adjustedOffsetY}px / var(--size) var(--size)`,
          mask: 'linear-gradient(-20deg, transparent 50%, white)',
          pointerEvents: 'none',
          zIndex: -1
        }}
      >      </div>
      {/* Visual indicator for 34x19 usable area - toggled with F3 */}
      {showDebugOutline && (
        <div
          style={{
            position: 'fixed',
            left: `${rawBounds.minX}px`,
            top: `${rawBounds.minY}px`,
            width: `${areaWidth}px`,
            height: `${areaHeight}px`,
            border: '2px solid rgba(255, 100, 100, 0.6)',
            boxShadow: '0 0 10px rgba(255, 100, 100, 0.3), inset 0 0 10px rgba(255, 100, 100, 0.1)',
            pointerEvents: 'none',
            zIndex: 0,
            borderRadius: '2px'
          }}
        >
          {/* Label showing dimensions */}
          <div
            style={{
              position: 'absolute',
              top: '-24px',
              left: '0',
              color: 'rgba(255, 100, 100, 0.8)',
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '2px 6px',
              borderRadius: '2px'
            }}
          >
            {getUsableGridWidth()}×{getUsableGridHeight()} usable area
          </div>
        </div>
      )}
    </>
  )
}

