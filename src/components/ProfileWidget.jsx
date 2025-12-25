import BaseWidget from './BaseWidget'
import './Widget.css'

export default function ProfileWidget() {
  return (
    <BaseWidget className="widget-profile">
      <div className="widget-header">
        <h2>Alex Chen</h2>
        <span className="widget-label">Developer & Designer</span>
      </div>
      <p className="widget-description">
        Building digital experiences with code and creativity.
      </p>
    </BaseWidget>
  )
}

