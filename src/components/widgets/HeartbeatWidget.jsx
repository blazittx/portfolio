import { useState, useEffect, useRef } from 'react'
import BaseWidget from './BaseWidget'

/* eslint-disable react/prop-types */

export default function HeartbeatWidget() {
  const [bpm, setBpm] = useState(72) // Default BPM
  const [isBeating, setIsBeating] = useState(false)
  const beatIntervalRef = useRef(null)

  // Simulate heartbeat - in a real implementation, this would fetch from an API
  useEffect(() => {
    // Generate a realistic BPM between 60-100
    const generateBPM = () => {
      // Simulate slight variations in heart rate
      const baseBPM = 72
      const variation = Math.floor(Math.random() * 20) - 10 // -10 to +10
      return Math.max(60, Math.min(100, baseBPM + variation))
    }

    // Update BPM periodically
    const bpmInterval = setInterval(() => {
      setBpm(generateBPM())
    }, 5000) // Update BPM every 5 seconds

    // Calculate beat interval based on BPM
    const updateBeatInterval = () => {
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current)
      }

      const beatDelay = (60 / bpm) * 1000 // Convert BPM to milliseconds
      
      beatIntervalRef.current = setInterval(() => {
        setIsBeating(true)
        setTimeout(() => {
          setIsBeating(false)
        }, 150) // Beat duration
      }, beatDelay)
    }

    updateBeatInterval()

    return () => {
      clearInterval(bpmInterval)
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current)
      }
    }
  }, [bpm])

  return (
    <BaseWidget padding="1rem">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '0.75rem'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          margin: 0,
          letterSpacing: '-0.01em',
          color: 'canvasText',
          opacity: 0.5,
          flexShrink: 0
        }}>
          My literal heartbeat
        </h3>
        
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 1
        }}>
          {/* Heartbeat visualization */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {/* Heart icon/beat animation */}
            <div style={{
              fontSize: '2rem',
              color: isBeating ? '#ff4444' : 'color-mix(in hsl, canvasText, transparent 60%)',
              transition: 'transform 0.15s ease, color 0.15s ease',
              transform: isBeating ? 'scale(1.2)' : 'scale(1)',
              lineHeight: 1
            }}>
              ❤️
            </div>
          </div>

          {/* BPM display */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: '0.5rem',
            flexShrink: 0
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'canvasText',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {bpm}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'canvasText',
              opacity: 0.6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              BPM
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  )
}

