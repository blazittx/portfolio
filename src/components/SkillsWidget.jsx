import { useRef, useEffect, useState } from 'react'
import BaseWidget from './BaseWidget'
import './Widget.css'

export default function SkillsWidget() {
  const skills = ['React', 'TypeScript', 'Node.js', 'Design Systems', 'Python', 'JavaScript', 'CSS', 'HTML', 'Git', 'Webpack', 'Vite', 'Next.js']
  const scrollContainerRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const scrollRef = useRef({ position: 0, speed: 0.5 })

  useEffect(() => {
    if (isHovered || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    let animationFrame = null
    
    const scroll = () => {
      if (!isHovered && container) {
        scrollRef.current.position += scrollRef.current.speed
        container.scrollLeft = scrollRef.current.position
        
        // Reset to start when reaching end for infinite scroll
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
          scrollRef.current.position = 0
          container.scrollLeft = 0
        }
        
        animationFrame = requestAnimationFrame(scroll)
      }
    }

    animationFrame = requestAnimationFrame(scroll)
    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isHovered])

  // Duplicate skills for seamless infinite scroll
  const duplicatedSkills = [...skills, ...skills, ...skills]
  
  return (
    <BaseWidget className="widget-skills">
      <h3>Skills</h3>
      <div 
        ref={scrollContainerRef}
        className="skills-grid skills-auto-scroll"
        onMouseEnter={() => {
          setIsHovered(true)
          if (scrollContainerRef.current) {
            scrollRef.current.position = scrollContainerRef.current.scrollLeft
          }
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        {duplicatedSkills.map((skill, i) => (
          <span key={i} className="skill-tag">{skill}</span>
        ))}
      </div>
    </BaseWidget>
  )
}

