import BaseWidget from "./BaseWidget";
import "./Widget.css";

export default function SkillsWidget() {
  const skills = [
    "React",
    "TypeScript",
    "Node.js",
    "Design Systems",
    "Python",
    "JavaScript",
    "CSS",
    "HTML",
    "Git",
    "Webpack",
    "Vite",
    "Next.js",
  ];

  return (
    <BaseWidget
      className="widget-skills"
      padding="0.875rem 0.5rem 0.875rem 0.875rem"
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
    >
      <h3>Skills</h3>
      <div className="skills-grid">
        {skills.map((skill, i) => (
          <span key={i} className="skill-tag">
            {skill}
          </span>
        ))}
      </div>
    </BaseWidget>
  );
}
