import './AutosortButton.css'

/* eslint-disable react/prop-types */
export default function AutosortButton({ onClick }) {
  return (
    <button 
      className="autosort-button"
      onClick={onClick}
      title="Auto-sort widgets"
    >
      ↻ Sort
    </button>
  )
}

