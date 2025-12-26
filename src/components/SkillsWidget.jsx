import BaseWidget from "./BaseWidget";
import { useEffect, useRef, useState } from "react";

export default function SkillsWidget() {
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

  const skills = ["C#", "Unity", "Unreal Engine", "C++", "Git"];

  const getH3Style = () => ({
    fontSize: "1.125rem",
    fontWeight: 600,
    margin: "0 0 auto 0",
    letterSpacing: "-0.01em",
    color: "canvasText",
    flexShrink: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingRight: "4px",
    display:
      sizeClass.includes("short") || sizeClass.includes("very-short")
        ? "none"
        : "block",
  });

  const getGridStyle = () => {
    const base = {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
      gridAutoRows: "1fr",
      columnGap: "0.5rem",
      rowGap: "0.5rem",
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      width: "100%",
      alignContent: "stretch",
      paddingRight: 0,
      marginRight: 0,
    };
    if (sizeClass.includes("short") || sizeClass.includes("very-short")) {
      base.columnGap = "0.375rem";
    }
    return base;
  };

  const getTagStyle = () => {
    const base = {
      fontSize: "0.8125rem",
      padding: "0.375rem 0.75rem",
      background: "color-mix(in hsl, canvasText, transparent 97%)",
      border: "1px solid color-mix(in hsl, canvasText, transparent 6%)",
      borderRadius: "4px",
      color: "canvasText",
      opacity: 0.65,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      minHeight: 0,
      marginRight: 0,
    };
    if (sizeClass.includes("short") || sizeClass.includes("very-short")) {
      base.fontSize = "0.75rem";
      base.padding = "0.25rem 0.5rem";
    }
    if (!sizeClass.includes("short") && !sizeClass.includes("very-short")) {
      base.padding = "0.5rem 1rem";
      base.fontSize = "0.875rem";
    }
    return base;
  };

  return (
    <BaseWidget
      padding="0.875rem 0.5rem 0.875rem 0.875rem"
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
    >
      <div ref={containerRef}>
        <h3 style={getH3Style()}>Skills</h3>
        <div style={getGridStyle()}>
          {skills.map((skill, i) => (
            <span key={i} style={getTagStyle()}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    </BaseWidget>
  );
}
