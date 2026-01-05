import { useState, useMemo, useEffect } from 'react'
import BaseWidget from '../BaseWidget'
import { YOUTUBE_URLS } from '../../../constants/games'
import {
  isYouTubeUrl,
} from '../../../utils/youtube'
import MediaCarousel from '../MediaCarousel'

/* eslint-disable react/prop-types */

export default function GameImageWidget({ game }) {
  // Get video URL from manual mapping first, then fall back to game data
  const videoUrl = useMemo(() => {
    return YOUTUBE_URLS[game.id] || game.videoUrl || game.youtube_url || game.trailer_url || null
  }, [game.id, game.videoUrl, game.youtube_url, game.trailer_url])

  // Build media array: video first (if present), then screenshots, then fallback to background image
  const mediaArray = useMemo(() => {
    if (!game) return []
    const media = []
    // Add video as first item if present
    if (videoUrl && isYouTubeUrl(videoUrl)) {
      media.push({ type: 'video', url: videoUrl })
    }
    // Add screenshots if available
    if (game.screenshots && Array.isArray(game.screenshots) && game.screenshots.length > 0) {
      game.screenshots.forEach((screenshotUrl) => {
        media.push({ type: 'image', url: screenshotUrl })
      })
    } else if (game.image) {
      // Fallback to background image if no screenshots
      media.push({ type: 'image', url: game.image })
    }
    return media
  }, [game, videoUrl])

  const [currentIndex, setCurrentIndex] = useState(0)

  // Reset image index when game changes
  useEffect(() => {
    if (mediaArray.length === 0) {
      setCurrentIndex(0)
      return
    }
    const videoIndex = mediaArray.findIndex((item) => item.type === 'video')
    setCurrentIndex(videoIndex >= 0 ? videoIndex : 0)
  }, [game?.id, mediaArray])

  return (
    <BaseWidget padding="0.5rem">
      <MediaCarousel
        media={mediaArray}
        title={game.title}
        layout="horizontal"
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        autoAdvance
        imageIntervalMs={3000}
        videoIntervalMs={8000}
        carouselId={`detail-${game.id}`}
      />
    </BaseWidget>
  )
}

