import { useState, useEffect, useRef } from 'react'
import BaseWidget from '../BaseWidget'

/* eslint-disable react/prop-types */

export default function GameImageWidget({ game }) {
  // Add global style to hide scrollbars for thumbnail containers
  useEffect(() => {
    if (!document.getElementById('thumbnail-scrollbar-hide')) {
      const style = document.createElement('style')
      style.id = 'thumbnail-scrollbar-hide'
      style.textContent = `
        [data-thumbnail-container] {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        [data-thumbnail-container]::-webkit-scrollbar {
          display: none;
        }
      `
      document.head.appendChild(style)
    }
  }, [])
  // For now, use the same image multiple times (will be replaced with actual images later)
  const images = [game.image, game.image, game.image, game.image, game.image]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
      }, 3000) // Auto-scroll every 3 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isHovered, images.length])

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index)
  }

  return (
    <BaseWidget padding="0.5rem">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          gap: '0.5rem'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Large image on top */}
        <div style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          borderRadius: '4px',
          background: 'color-mix(in hsl, canvasText, transparent 98%)'
        }}>
          <img 
            src={images[currentIndex]} 
            alt={`${game.title} - Image ${currentIndex + 1}`}
            draggable="false"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              userSelect: 'none',
              transition: 'opacity 0.3s ease'
            }}
            loading="lazy"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/800x600?text=Game+Image";
            }}
          />
        </div>

        {/* Thumbnail images below */}
        <div 
          data-thumbnail-container
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '0.5rem',
            overflowX: 'hidden',
            overflowY: 'hidden',
            paddingBottom: '0.25rem',
            flexShrink: 0,
            flexWrap: 'wrap',
            justifyContent: 'flex-start'
          }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              onClick={() => handleThumbnailClick(index)}
              style={{
                position: 'relative',
                width: '60px',
                height: '60px',
                flexShrink: 0,
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: currentIndex === index 
                  ? '2px solid canvasText' 
                  : '2px solid transparent',
                opacity: currentIndex === index ? 1 : 0.7,
                transition: 'opacity 0.2s ease, border-color 0.2s ease',
                background: 'color-mix(in hsl, canvasText, transparent 98%)'
              }}
              onMouseEnter={(e) => {
                if (currentIndex !== index) {
                  e.currentTarget.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                if (currentIndex !== index) {
                  e.currentTarget.style.opacity = '0.7'
                }
              }}
            >
              <img 
                src={image} 
                alt={`${game.title} - Thumbnail ${index + 1}`}
                draggable="false"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  userSelect: 'none'
                }}
                loading="lazy"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/60x60?text=Image";
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  )
}

