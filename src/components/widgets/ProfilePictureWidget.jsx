import BaseWidget from './BaseWidget'
import { useState } from 'react'

/* eslint-disable react/prop-types */
export default function ProfilePictureWidget() {
  const [isHovered, setIsHovered] = useState(false)

  const getImageStyle = () => {
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '4px',
      display: 'block',
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
      overflow: 'hidden'
    }
  }

  return (
    <BaseWidget padding="0.75rem">
      <div 
        style={getContainerStyle()}
      >
        <img 
          src="/profilePic.png" 
          alt="Profile Picture" 
          draggable="false"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          style={getImageStyle()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </BaseWidget>
  )
}

