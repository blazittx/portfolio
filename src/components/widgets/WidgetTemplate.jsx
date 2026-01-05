/* eslint-disable react/prop-types */
export default function WidgetTemplate({ title = "Widget Title", children }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "1rem",
        color: "var(--color-canvas-text, #ffffff)",
      }}
    >
      <header
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>{children || "Add your content here."}</div>
    </div>
  );
}
