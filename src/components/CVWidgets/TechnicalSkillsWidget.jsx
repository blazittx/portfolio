import BaseWidget from "../BaseWidget";
import { useEffect, useRef, useState } from "react";

/* eslint-disable react/prop-types */
export default function TechnicalSkillsWidget({ widget }) {
  const containerRef = useRef(null);
  const [sizeClass, setSizeClass] = useState("");

  useEffect(() => {
    const updateSizeClass = () => {
      if (!containerRef.current) return;
      const { height } = containerRef.current.getBoundingClientRect();
      const isShort = height < 150;
      const isVeryShort = height < 100;
      let classes = [];
      if (isShort) classes.push("short");
      if (isVeryShort) classes.push("very-short");
      setSizeClass(classes.join(" "));
    };
    updateSizeClass();
    const resizeObserver = new ResizeObserver(updateSizeClass);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Default technical skills - can be customized via widget settings
  const technicalSkills = widget?.settings?.technicalSkills || [
    "Unity",
    "Unreal Engine",
    "C#",
    "C++",
    "Blueprints",
    "Git",
/*     "JavaScript",
    "React",
    "FMOD",
    "FEEL",
     */
  ];

  const getH3Style = () => ({
    fontSize: sizeClass.includes("very-short")
      ? "0.9375rem"
      : sizeClass.includes("short")
      ? "1rem"
      : "1.125rem",
    fontWeight: 600,
    margin: "0 0 0.75rem 0",
    letterSpacing: "-0.01em",
    color: "canvasText",
    flexShrink: 0,
    display: sizeClass.includes("very-short") ? "none" : "block",
  });

  const getGridStyle = () => {
    const base = {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
      gridAutoRows: "auto",
      columnGap: "0.5rem",
      rowGap: "0.5rem",
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      width: "100%",
      alignContent: "start",
    };
    if (sizeClass.includes("short") || sizeClass.includes("very-short")) {
      base.columnGap = "0.375rem";
      base.rowGap = "0.375rem";
    }
    return base;
  };

  const getTagStyle = () => {
    const base = {
      fontSize: "0.8125rem",
      padding: "0.375rem 0.75rem",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      borderRadius: "4px",
      color: "canvasText",
      opacity: 0.65,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "nowrap",
      textAlign: "center",
    };
    if (sizeClass.includes("short") || sizeClass.includes("very-short")) {
      base.fontSize = "0.75rem";
      base.padding = "0.25rem 0.5rem";
    }
    return base;
  };

  return (
    <BaseWidget padding="1rem 0.75rem 1rem 1rem" style={{ gap: "0.75rem" }}>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <h3 style={getH3Style()}>Technical Skills</h3>
        <div style={getGridStyle()}>
          {technicalSkills.map((skill, index) => (
            <div key={index} style={getTagStyle()}>
              {skill}
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  );
}
