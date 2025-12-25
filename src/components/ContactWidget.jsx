import BaseWidget from './BaseWidget'
import './Widget.css'

export default function ContactWidget() {
  return (
    <BaseWidget className="widget-contact">
      <h3>Contact</h3>
      <div className="contact-links">
        <a href="mailto:hello@example.com">Email</a>
        <a href="https://github.com">GitHub</a>
        <a href="https://linkedin.com">LinkedIn</a>
      </div>
    </BaseWidget>
  )
}

