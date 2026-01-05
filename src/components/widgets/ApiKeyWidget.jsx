import BaseWidget from "./BaseWidget";
import { useState, useEffect } from "react";

const API_KEY_STORAGE_KEY = "portfolio_api_key";

export default function ApiKeyWidget() {
  // Load API key from localStorage on mount
  const [apiKey, setApiKey] = useState(() => {
    try {
      const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
      return saved || "";
    } catch (error) {
      console.error("Error loading API key from localStorage:", error);
      return "";
    }
  });

  // Save API key to localStorage whenever it changes
  useEffect(() => {
    try {
      if (apiKey) {
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      } else {
        // Remove from storage if empty
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error saving API key to localStorage:", error);
    }
  }, [apiKey]);

  const inputStyle = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    background: "color-mix(in hsl, canvasText, transparent 97%)",
    border: "1px solid color-mix(in hsl, canvasText, transparent 6%)",
    borderRadius: "4px",
    color: "canvasText",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    flex: 1,
    minHeight: 0,
    pointerEvents: "auto",
    cursor: "text",
  };

  const labelStyle = {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "canvasText",
    marginBottom: "0.5rem",
    opacity: 0.8,
    flexShrink: 0,
  };

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    gap: "0.5rem",
    pointerEvents: "auto",
  };

  return (
    <BaseWidget padding="1rem">
      <div style={containerStyle}>
        <label style={labelStyle} htmlFor="api-key-input">
          API Key
        </label>
        <input
          id="api-key-input"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key..."
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "color-mix(in hsl, canvasText, transparent 20%)";
            e.currentTarget.style.background = "color-mix(in hsl, canvasText, transparent 95%)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "color-mix(in hsl, canvasText, transparent 6%)";
            e.currentTarget.style.background = "color-mix(in hsl, canvasText, transparent 97%)";
          }}
        />
      </div>
    </BaseWidget>
  );
}

