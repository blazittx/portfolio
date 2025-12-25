import BaseWidget from './BaseWidget'
import './Widget.css'

export default function ProjectsWidget() {
  const projects = [
    { name: 'Project Alpha', year: '2024' },
    { name: 'Project Beta', year: '2023' },
    { name: 'Project Gamma', year: '2023' }
  ]

  return (
    <BaseWidget className="widget-projects">
      <h3>Projects</h3>
      <ul className="project-list">
        {projects.map((project, i) => (
          <li key={i}>
            <span className="project-name">{project.name}</span>
            <span className="project-year">{project.year}</span>
          </li>
        ))}
      </ul>
    </BaseWidget>
  )
}

