import BaseWidget from './BaseWidget'
import { useState } from 'react'

/* eslint-disable react/prop-types */
export default function ProfilePictureWidget({ widget }) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (widget?.onToggleExpand) {
      widget.onToggleExpand()
    }
  }

  const getImageStyle = () => {
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '4px',
      display: 'block',
      cursor: 'pointer',
      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: 'transform'
    }
  }

  const getContainerStyle = () => {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      cursor: 'pointer'
    }
  }

  return (
    <BaseWidget padding="0.75rem">
      <div 
        style={getContainerStyle()}
        onClick={handleClick}
        onMouseDown={(e) => {
          // Prevent drag when clicking on the image
          e.stopPropagation()
        }}
      >
        <img 
          src="/profilePic.png" 
          alt="Profile Picture" 
          draggable="false"
          style={getImageStyle()}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDragStart={(e) => e.preventDefault()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    </BaseWidget>
  )
}

