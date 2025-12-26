import './GridBackground.css'

export default function GridMask({ widgets }) {
  return (
    <>
      {widgets.map(widget => (
        <div
          key={`grid-mask-${widget.id}`}
          className="grid-mask"
          style={{
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

