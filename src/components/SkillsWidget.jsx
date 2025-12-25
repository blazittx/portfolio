import BaseWidget from './BaseWidget'
import './Widget.css'

export default function SkillsWidget() {
  const skills = ['React', 'TypeScript', 'Node.js', 'Design Systems']
  
  return (
    <BaseWidget className="widget-skills">
      <h3>Skills</h3>
      <div className="skills-grid">
        {skills.map((skill, i) => (
          <span key={i} className="skill-tag">{skill}</span>
        ))}
      </div>
    </BaseWidget>
  )
}

