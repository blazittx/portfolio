import BaseWidget from "../BaseWidget";
import { useEffect, useRef, useState } from "react";

/* eslint-disable react/prop-types */
export default function LanguagesWidget({ widget }) {
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

  // Default languages - can be customized via widget settings
  const languages = widget?.settings?.languages || [
    { name: "English", level: "Professional working" },
    { name: "Turkish", level: "Native" },
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

  const getItemStyle = () => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: sizeClass.includes("very-short")
      ? "0.5rem"
      : sizeClass.includes("short")
      ? "0.75rem"
      : "1rem",
    paddingBottom: sizeClass.includes("very-short")
      ? "0.5rem"
      : sizeClass.includes("short")
      ? "0.75rem"
      : "1rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  });

  const getNameStyle = () => ({
    fontSize: sizeClass.includes("very-short")
      ? "0.8125rem"
      : sizeClass.includes("short")
      ? "0.875rem"
      : "0.9375rem",
    fontWeight: 500,
    color: "canvasText",
    flex: 1,
  });

  const getLevelStyle = () => ({
    fontSize: sizeClass.includes("very-short")
      ? "0.6875rem"
      : sizeClass.includes("short")
      ? "0.75rem"
      : "0.8125rem",
    color: "canvasText",
    opacity: 0.6,
    marginLeft: "0.5rem",
  });

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
        <h3 style={getH3Style()}>Languages</h3>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {languages.map((lang, index) => (
            <div
              key={index}
              style={
                index < languages.length - 1 ? getItemStyle() : getItemStyle()
              }
            >
              <div style={getNameStyle()}>{lang.name}</div>
              <div style={getLevelStyle()}>{lang.level}</div>
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  );
}
