import BaseWidget from "./BaseWidget";
import { useEffect, useRef, useState } from "react";

/* eslint-disable react/prop-types */
export default function ProfileWidget() {
  const containerRef = useRef(null);
  const [sizeClass, setSizeClass] = useState("");

  useEffect(() => {
    const updateSizeClass = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const isShort = height < 150;
      const isVeryShort = height < 100;
      const isNarrow = width < 200;
      let classes = [];
      if (isShort) classes.push("short");
      if (isVeryShort) classes.push("very-short");
      if (isNarrow) classes.push("narrow");
      setSizeClass(classes.join(" "));
    };
    updateSizeClass();
    const resizeObserver = new ResizeObserver(updateSizeClass);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const getContentStyle = () => {
    return {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
      textAlign: "left",
      width: "100%",
      height: "100%",
      gap: "0.2rem",
    };
  };

  const getH2Style = () => {
    const base = {
      fontSize: "2.25rem",
      fontWeight: 600,
      margin: 0,
      letterSpacing: "-0.02em",
      color: "canvasText",
      lineHeight: 1.2,
    };

    if (sizeClass.includes("narrow")) {
      base.fontSize = "1.75rem";
    }
    if (sizeClass.includes("short")) {
      base.fontSize = "1.875rem";
      if (sizeClass.includes("narrow")) {
        base.fontSize = "1.5rem";
      }
    }
    if (sizeClass.includes("very-short")) {
      base.fontSize = "1.5rem";
      if (sizeClass.includes("narrow")) {
        base.fontSize = "1.25rem";
      }
    }

    return base;
  };

  const getLabelStyle = () => {
    const base = {
      fontSize: "1rem",
      opacity: 0.6,
      color: "canvasText",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      lineHeight: 1.4,
    };

    if (sizeClass.includes("narrow")) {
      base.fontSize = "0.875rem";
    }
    if (sizeClass.includes("short") || sizeClass.includes("very-short")) {
      base.fontSize = "0.875rem";
      if (sizeClass.includes("narrow")) {
        base.fontSize = "0.75rem";
      }
    }

    return base;
  };

  return (
    <BaseWidget padding="1.25rem">
      <div ref={containerRef} style={getContentStyle()}>
        <h2 style={getH2Style()}>Doruk Sasmaz</h2>
        <span style={getLabelStyle()}>Game Programmer</span>
      </div>
    </BaseWidget>
  );
}
