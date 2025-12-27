import { useState, useEffect, useRef, useMemo } from 'react'
import BaseWidget from '../BaseWidget'
import { YOUTUBE_URLS } from '../../constants/games'
import {
  isYouTubeUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  setYouTubeVolume,
} from '../../utils/youtube'

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

  // Get video URL from manual mapping first, then fall back to game data
  const videoUrl = useMemo(() => {
    return YOUTUBE_URLS[game.id] || game.videoUrl || game.youtube_url || game.trailer_url || null
  }, [game.id, game.videoUrl, game.youtube_url, game.trailer_url])

  // Build media array: video first (if present), then images
  const mediaArray = useMemo(() => {
    if (!game) return []
    const media = []
    // Add video as first item if present
    if (videoUrl && isYouTubeUrl(videoUrl)) {
      media.push({ type: 'video', url: videoUrl })
    }
    // Add images (repeat the same image 4 times for now, or until we have multiple images)
    if (game.image) {
      for (let i = 0; i < 4; i++) {
        media.push({ type: 'image', url: game.image })
      }
    }
    return media
  }, [game, videoUrl])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef(null)
  const videoIframeRef = useRef(null)

  // Reset image index when game changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [game?.id])

  useEffect(() => {
    if (!isHovered && mediaArray.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % mediaArray.length
          // Skip video if we're auto-scrolling (only show it when manually selected)
          if (nextIndex === 0 && mediaArray[0]?.type === 'video') {
            return 1 % mediaArray.length // Skip to first image
          }
          return nextIndex
        })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, mediaArray.length, game?.id])

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
        {/* Large media display on top */}
        <div style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          borderRadius: '4px',
          background: 'color-mix(in hsl, canvasText, transparent 98%)'
        }}>
          {(() => {
            const currentMedia = mediaArray[currentIndex]
            if (!currentMedia) return null

            if (currentMedia.type === 'video') {
              const embedUrl = getYouTubeEmbedUrl(currentMedia.url, {
                autoplay: 0,
                controls: 1,
                rel: 0
              })
              return (
                <iframe
                  ref={videoIframeRef}
                  key={`video-${game.id}-${currentIndex}`}
                  src={embedUrl}
                  title={`${game.title} - Video`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                  }}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onMouseDown={(e) => e.stopPropagation()}
                  onLoad={() => {
                    // Set volume to 50% when iframe loads
                    if (videoIframeRef.current) {
                      setTimeout(() => {
                        setYouTubeVolume(videoIframeRef.current, 50)
                      }, 100)
                    }
                  }}
                />
              )
            } else {
              return (
                <img 
                  src={currentMedia.url} 
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
                  onDragStart={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/800x600?text=Game+Image";
                  }}
                />
              )
            }
          })()}
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
          {mediaArray.map((media, index) => {
            const thumbnailUrl = media.type === 'video' 
              ? getYouTubeThumbnailUrl(media.url)
              : media.url

            return (
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
                {media.type === 'video' ? (
                  <>
                    <img 
                      src={thumbnailUrl || "https://via.placeholder.com/60x60?text=Video"} 
                      alt={`${game.title} - Video thumbnail`}
                      draggable="false"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        userSelect: 'none'
                      }}
                      loading="lazy"
                      onDragStart={(e) => e.preventDefault()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/60x60?text=Video";
                      }}
                    />
                    {/* Play icon overlay */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="white"
                        style={{ marginLeft: '2px' }}
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <img 
                    src={thumbnailUrl} 
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
                    onDragStart={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/60x60?text=Image";
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </BaseWidget>
  )
}

