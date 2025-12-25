import './ExplorationZone.css'

function ExplorationZone({ onTypeDetected }) {
  const handleZoneClick = (type) => {
    onTypeDetected(type)
  }

  return (
    <div className="exploration-zone">
      <div className="zone-container">
        <div 
          className="zone zone-technical"
          onClick={() => handleZoneClick('technical')}
        >
          <div className="zone-label">Technical</div>
        </div>
        <div 
          className="zone zone-center"
          onClick={() => handleZoneClick('general')}
        >
          <div className="zone-label">General</div>
        </div>
        <div 
          className="zone zone-hr"
          onClick={() => handleZoneClick('hr')}
        >
          <div className="zone-label">HR</div>
        </div>
      </div>
    </div>
  )
}

export default ExplorationZone

