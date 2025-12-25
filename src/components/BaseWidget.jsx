import './Widget.css'

export default function BaseWidget({ children, className = '' }) {
  return (
    <div className={`base-widget ${className}`}>
      {children}
    </div>
  )
}

