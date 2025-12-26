export default function GridBackground() {
  const size = 45
  const line = 'color-mix(in hsl, #ffffff, transparent 85%)'
  const lineSecondary = 'color-mix(in hsl, #808080, transparent 90%)'
  
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
          background: `linear-gradient(90deg, var(--line) 1px, transparent 1px var(--size)) calc(var(--size) * 0.36) 50% / var(--size) var(--size), linear-gradient(var(--line) 1px, transparent 1px var(--size)) 0% calc(var(--size) * 0.32) / var(--size) var(--size)`,
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
          background: `linear-gradient(90deg, var(--line) 1px, transparent 1px var(--size)) calc(var(--size) * 0.36) 50% / var(--size) var(--size), linear-gradient(var(--line) 1px, transparent 1px var(--size)) 0% calc(var(--size) * 0.32) / var(--size) var(--size)`,
          mask: 'linear-gradient(-20deg, transparent 50%, white)',
          pointerEvents: 'none',
          zIndex: -1
        }}
      ></div>
    </>
  )
}

