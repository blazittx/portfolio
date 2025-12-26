import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, USABLE_GRID_WIDTH, USABLE_GRID_HEIGHT } from '../../constants/grid'
import { getRawUsableAreaBounds } from '../../utils/grid'

/* eslint-disable react/prop-types */
export default function GridBackground({ centerOffset = { x: 0, y: 0 } }) {
  const size = 45
  const line = 'color-mix(in hsl, #ffffff, transparent 85%)'
  const lineSecondary = 'color-mix(in hsl, #808080, transparent 90%)'
  
  // Calculate the adjusted offset for the grid background
  // The grid offset is GRID_SIZE * 0.36 for X and GRID_SIZE * 0.32 for Y, and we add the center offset
  const adjustedOffsetX = size * 0.36 + (centerOffset.x || 0)
  const adjustedOffsetY = size * 0.32 + (centerOffset.y || 0)
  
  // Get the raw bounds of the 34x19 usable area (single source of truth)
  const rawBounds = getRawUsableAreaBounds(centerOffset)
  const areaWidth = rawBounds.maxX - rawBounds.minX
  const areaHeight = rawBounds.maxY - rawBounds.minY
  
  return (
    <>
      <div 
        style={{
          '--size': `${size}px`,
          '--line': line,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
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
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(90deg, var(--line) 1px, transparent 1px var(--size)) ${adjustedOffsetX}px 50% / var(--size) var(--size), linear-gradient(var(--line) 1px, transparent 1px var(--size)) 0% ${adjustedOffsetY}px / var(--size) var(--size)`,
          mask: 'linear-gradient(-20deg, transparent 50%, white)',
          pointerEvents: 'none',
          zIndex: -1
        }}
      ></div>
      {/* Visual indicator for 34x19 usable area */}
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
          {USABLE_GRID_WIDTH}×{USABLE_GRID_HEIGHT} usable area
        </div>
      </div>
    </>
  )
}

