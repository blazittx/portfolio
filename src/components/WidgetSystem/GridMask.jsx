export default function GridMask({ widgets }) {
  return (
    <>
      {widgets.map(widget => (
        <div
          key={`grid-mask-${widget.id}`}
          style={{
            position: 'fixed',
            background: 'hsl(0 0% 4%)',
            pointerEvents: 'none',
            zIndex: 0,
            left: `${widget.x}px`,
            top: `${widget.y}px`,
            width: `${widget.width}px`,
            height: `${widget.height}px`
          }}
        />
      ))}
    </>
  )
}

