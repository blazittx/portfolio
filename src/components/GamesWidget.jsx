import { useState, useEffect, useRef } from 'react'
import BaseWidget from './BaseWidget'
import './Widget.css'

export default function GamesWidget() {
  const games = [
    { 
      title: 'Game Title 1', 
      description: 'An exciting game experience with innovative mechanics',
      year: '2024',
      tech: 'Unity, C#',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop'
    },
    { 
      title: 'Game Title 2', 
      description: 'A puzzle adventure that challenges your mind',
      year: '2023',
      tech: 'Unreal Engine, Blueprint',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop'
    },
    { 
      title: 'Game Title 3', 
      description: 'Fast-paced action with stunning visuals',
      year: '2023',
      tech: 'Unity, C#',
      image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&h=600&fit=crop'
    },
    { 
      title: 'Game Title 4', 
      description: 'A narrative-driven experience',
      year: '2022',
      tech: 'Godot, GDScript',
      image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=600&fit=crop'
    }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const autoPlayRef = useRef(null)

  useEffect(() => {
    if (!isAutoPlaying) return

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length)
    }, 4000) // Change every 4 seconds

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, games.length])

  const goToSlide = (index) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % games.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + games.length) % games.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  return (
    <BaseWidget className="widget-games">
      <h3>Games</h3>
      <div 
        className="games-carousel"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div className="carousel-container">
          {games.map((game, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            >
              <div className="game-card">
                <div className="game-image-container">
                  <img 
                    src={game.image} 
                    alt={game.title}
                    className="game-image"
                    loading="lazy"
                  />
                  <div className="game-overlay">
                    <h4 className="game-title">{game.title}</h4>
                    <p className="game-description">{game.description}</p>
                  </div>
                </div>
                <div className="game-meta">
                  <span className="game-year">{game.year}</span>
                  <span className="game-tech">{game.tech}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="carousel-controls">
          <button 
            className="carousel-btn prev" 
            onClick={goToPrev}
            aria-label="Previous game"
          >
            ‹
          </button>
          <div className="carousel-dots">
            {games.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to game ${index + 1}`}
              />
            ))}
          </div>
          <button 
            className="carousel-btn next" 
            onClick={goToNext}
            aria-label="Next game"
          >
            ›
          </button>
        </div>
      </div>
    </BaseWidget>
  )
}

