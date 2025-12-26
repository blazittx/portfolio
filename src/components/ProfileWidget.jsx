import BaseWidget from './BaseWidget'
import './Widget.css'

export default function ProfileWidget() {
  return (
    <BaseWidget className="widget-profile" padding="1.25rem">
      <div className="widget-header">
        <h2>Doruk Sasmaz</h2>
        <span className="widget-label">Game Programmer</span>
      </div>
    </BaseWidget>
  )
}
