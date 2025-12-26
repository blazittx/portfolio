import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Apply global styles to root element
const rootElement = document.getElementById('root')
if (rootElement) {
  rootElement.style.setProperty('width', '100vw')
  rootElement.style.setProperty('height', '100vh')
  rootElement.style.setProperty('overflow', 'hidden')
  rootElement.style.setProperty('--grid-size', '45px')
}

// Apply global styles to html and body
document.documentElement.style.setProperty('background', 'hsl(0 0% 4%)')
document.documentElement.style.setProperty('color-scheme', 'dark only')
document.documentElement.style.setProperty('height', '100%')
document.documentElement.style.setProperty('overflow', 'hidden')

document.body.style.setProperty('height', '100vh')
document.body.style.setProperty('width', '100vw')
document.body.style.setProperty('overflow', 'hidden')
document.body.style.setProperty('font-family', '"JetBrains Mono", monospace')

// Apply box-sizing to all elements
const style = document.createElement('style')
style.textContent = `
  *, *:after, *:before {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
`
document.head.appendChild(style)

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)



