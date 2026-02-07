import { useMemo, useState, useEffect } from "react";
import BaseWidget from "../BaseWidget";
import { getDevelopmentInfo } from "../../../data/gameDevelopmentInfo";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getGameLinks } from "../../../constants/games";

/* eslint-disable react/prop-types */

const codeSamples = import.meta.glob("../../../codeSamples/**/*", {
  as: "raw",
  eager: true,
});

// Icon renderers for platform links
const renderSteamIcon = (size = "14") => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="currentColor"
    style={{
      display: "block",
      flexShrink: 0,
      opacity: 0.9,
    }}
  >
    <path d="M18.102 12.129c0-0 0-0 0-0.001 0-1.564 1.268-2.831 2.831-2.831s2.831 1.268 2.831 2.831c0 1.564-1.267 2.831-2.831 2.831-0 0-0 0-0.001 0h0c-0 0-0 0-0.001 0-1.563 0-2.83-1.267-2.83-2.83 0-0 0-0 0-0.001v0zM24.691 12.135c0-2.081-1.687-3.768-3.768-3.768s-3.768 1.687-3.768 3.768c0 2.081 1.687 3.768 3.768 3.768v0c2.080-0.003 3.765-1.688 3.768-3.767v-0zM10.427 23.76l-1.841-0.762c0.524 1.078 1.611 1.808 2.868 1.808 1.317 0 2.448-0.801 2.93-1.943l0.008-0.021c0.155-0.362 0.246-0.784 0.246-1.226 0-1.757-1.424-3.181-3.181-3.181-0.405 0-0.792 0.076-1.148 0.213l0.022-0.007 1.903 0.787c0.852 0.364 1.439 1.196 1.439 2.164 0 1.296-1.051 2.347-2.347 2.347-0.324 0-0.632-0.066-0.913-0.184l0.015 0.006zM15.974 1.004c-7.857 0.001-14.301 6.046-14.938 13.738l-0.004 0.054 8.038 3.322c0.668-0.462 1.495-0.737 2.387-0.737 0.001 0 0.002 0 0.002 0h-0c0.079 0 0.156 0.005 0.235 0.008l3.575-5.176v-0.074c0.003-3.12 2.533-5.648 5.653-5.648 3.122 0 5.653 2.531 5.653 5.653s-2.531 5.653-5.653 5.653h-0.131l-5.094 3.638c0 0.065 0.005 0.131 0.005 0.199 0 0.001 0 0.002 0 0.003 0 2.342-1.899 4.241-4.241 4.241-2.047 0-3.756-1.451-4.153-3.38l-0.005-0.027-5.755-2.383c1.841 6.345 7.601 10.905 14.425 10.905 8.281 0 14.994-6.713 14.994-14.994s-6.713-14.994-14.994-14.994c-0 0-0.001 0-0.001 0h0z"></path>
  </svg>
);

const renderItchIcon = (size = "14") => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 245.37069 220.73612"
    fill="currentColor"
    style={{
      display: "block",
      flexShrink: 0,
      opacity: 0.9,
    }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M31.99 1.365C21.287 7.72.2 31.945 0 38.298v10.516C0 62.144 12.46 73.86 23.773 73.86c13.584 0 24.902-11.258 24.903-24.62 0 13.362 10.93 24.62 24.515 24.62 13.586 0 24.165-11.258 24.165-24.62 0 13.362 11.622 24.62 25.207 24.62h.246c13.586 0 25.208-11.258 25.208-24.62 0 13.362 10.58 24.62 24.164 24.62 13.585 0 24.515-11.258 24.515-24.62 0 13.362 11.32 24.62 24.903 24.62 11.313 0 23.773-11.714 23.773-25.046V38.298c-.2-6.354-21.287-30.58-31.988-36.933C180.118.197 157.056-.005 122.685 0c-34.37.003-81.228.54-90.697 1.365zm65.194 66.217a28.025 28.025 0 0 1-4.78 6.155c-5.128 5.014-12.157 8.122-19.906 8.122a28.482 28.482 0 0 1-19.948-8.126c-1.858-1.82-3.27-3.766-4.563-6.032l-.006.004c-1.292 2.27-3.092 4.215-4.954 6.037a28.5 28.5 0 0 1-19.948 8.12c-.934 0-1.906-.258-2.692-.528-1.092 11.372-1.553 22.24-1.716 30.164l-.002.045c-.02 4.024-.04 7.333-.06 11.93.21 23.86-2.363 77.334 10.52 90.473 19.964 4.655 56.7 6.775 93.555 6.788h.006c36.854-.013 73.59-2.133 93.554-6.788 12.883-13.14 10.31-66.614 10.52-90.474-.022-4.596-.04-7.905-.06-11.93l-.003-.045c-.162-7.926-.623-18.793-1.715-30.165-.786.27-1.757.528-2.692.528a28.5 28.5 0 0 1-19.948-8.12c-1.862-1.822-3.662-3.766-4.955-6.037l-.006-.004c-1.294 2.266-2.705 4.213-4.563 6.032a28.48 28.48 0 0 1-19.947 8.125c-7.748 0-14.778-3.11-19.906-8.123a28.025 28.025 0 0 1-4.78-6.155 27.99 27.99 0 0 1-4.736 6.155 28.49 28.49 0 0 1-19.95 8.124c-.27 0-.54-.012-.81-.02h-.007c-.27.008-.54.02-.813.02a28.49 28.49 0 0 1-19.95-8.123 27.992 27.992 0 0 1-4.736-6.155zm-20.486 26.49l-.002.01h.015c8.113.017 15.32 0 24.25 9.746 7.028-.737 14.372-1.105 21.722-1.094h.006c7.35-.01 14.694.357 21.723 1.094 8.93-9.747 16.137-9.73 24.25-9.746h.014l-.002-.01c3.833 0 19.166 0 29.85 30.007L210 165.244c8.504 30.624-2.723 31.373-16.727 31.4-20.768-.773-32.267-15.855-32.267-30.935-11.496 1.884-24.907 2.826-38.318 2.827h-.006c-13.412 0-26.823-.943-38.318-2.827 0 15.08-11.5 30.162-32.267 30.935-14.004-.027-25.23-.775-16.726-31.4L46.85 124.08c10.684-30.007 26.017-30.007 29.85-30.007zm45.985 23.582v.006c-.02.02-21.863 20.08-25.79 27.215l14.304-.573v12.474c0 .584 5.74.346 11.486.08h.006c5.744.266 11.485.504 11.485-.08v-12.474l14.304.573c-3.928-7.135-25.79-27.215-25.79-27.215v-.006l-.003.002z" />
  </svg>
);

const getCodeSample = (filename) => {
  return codeSamples[`../../../codeSamples/${filename}`] || "";
};

const parseAttributes = (raw) => {
  if (!raw) return {};
  return raw
    .trim()
    .split(/\s+/)
    .reduce((attrs, part) => {
      if (!part.includes("=")) return attrs;
      const [key, value] = part.split("=");
      if (!key) return attrs;
      const cleanValue = value ? value.replace(/^['"]|['"]$/g, "") : "";
      attrs[key] = cleanValue;
      return attrs;
    }, {});
};

const parseCodeInfo = (info) => {
  const tokens = info.trim().split(/\s+/).filter(Boolean);
  let language = "";
  const attrTokens = [];
  tokens.forEach((token) => {
    if (token.includes("=")) {
      attrTokens.push(token);
      return;
    }
    if (!language) {
      language = token;
      return;
    }
    attrTokens.push(token);
  });
  return {
    language,
    attrs: parseAttributes(attrTokens.join(" ")),
  };
};

const parseDirectiveLine = (line) => {
  const match = line.match(/^:::\s*([a-zA-Z0-9_-]+)(.*)$/);
  if (!match) return null;
  return {
    name: match[1],
    attrs: parseAttributes(match[2] || ""),
  };
};

const toCssWidth = (value) => {
  if (!value) return null;
  if (value.endsWith("%") || value.endsWith("px") || value.endsWith("rem")) {
    return value;
  }
  if (/^\d+$/.test(value)) {
    return `${value}%`;
  }
  return value;
};

const getYouTubeId = (input) => {
  if (!input) return "";
  if (/^[a-zA-Z0-9_-]{6,}$/.test(input)) return input;
  const match = input.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  return match ? match[1] : "";
};

const renderInline = (text) => {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text))) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      elements.push(
        <strong key={`${match.index}-bold`}>{token.slice(2, -2)}</strong>
      );
    } else if (token.startsWith("*")) {
      elements.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      elements.push(
        <code
          key={`${match.index}-code`}
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            background: "color-mix(in hsl, canvasText, transparent 90%)",
            padding: "0.1rem 0.25rem",
            borderRadius: "3px",
            fontSize: "0.85em",
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        elements.push(
          <a
            key={`${match.index}-link`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        elements.push(token);
      }
    } else {
      elements.push(token);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length ? elements : text;
};

const isBlockStart = (line) => {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("```") ||
    trimmed.startsWith(":::") ||
    trimmed === "---" ||
    /^!\[.*\]\(.*\)$/.test(trimmed) ||
    /^[-*]\s+/.test(trimmed) ||
    /^\d+\.\s+/.test(trimmed)
  );
};

const parseMarkdown = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  let index = 0;

  const parseBlocks = (stopOnDirectiveEnd = false) => {
    const blocks = [];

    while (index < lines.length) {
      const rawLine = lines[index];
      const line = rawLine.trimEnd();

      if (stopOnDirectiveEnd && line.trim() === ":::") {
        index += 1;
        break;
      }

      if (line.trim() === "") {
        index += 1;
        continue;
      }

      if (line.startsWith("```")) {
        const info = line.slice(3).trim();
        const { language, attrs } = parseCodeInfo(info);
        index += 1;
        const codeLines = [];
        while (
          index < lines.length &&
          !lines[index].trimStart().startsWith("```")
        ) {
          codeLines.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) {
          index += 1;
        }
        const filename = attrs.file || attrs.filename;
        const inlineContent = codeLines.join("\n");
        const content = filename
          ? getCodeSample(filename) || inlineContent
          : inlineContent;
        blocks.push({
          type: "code",
          language: attrs.lang || language || "text",
          content,
          filename,
        });
        continue;
      }

      if (line.startsWith(":::")) {
        const directive = parseDirectiveLine(line);
        index += 1;
        const children = parseBlocks(true);
        if (directive) {
          blocks.push({
            type: "directive",
            name: directive.name,
            attrs: directive.attrs,
            children,
          });
        }
        continue;
      }

      if (line.startsWith("#")) {
        const match = line.match(/^(#{1,6})\s+(.*)$/);
        if (match) {
          blocks.push({
            type: "heading",
            level: match[1].length,
            content: match[2],
          });
          index += 1;
          continue;
        }
      }

      if (line.trim() === "---") {
        blocks.push({ type: "divider" });
        index += 1;
        continue;
      }

      if (/^!\[.*\]\(.*\)$/.test(line.trim())) {
        const imageMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imageMatch) {
          blocks.push({
            type: "image",
            alt: imageMatch[1],
            src: imageMatch[2],
          });
          index += 1;
          continue;
        }
      }

      if (/^[-*]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim())) {
        const ordered = /^\d+\.\s+/.test(line.trim());
        const items = [];
        while (index < lines.length) {
          const listLine = lines[index].trim();
          if (listLine === "") {
            index += 1;
            break;
          }
          if (ordered && !/^\d+\.\s+/.test(listLine)) break;
          if (!ordered && !/^[-*]\s+/.test(listLine)) break;
          const itemText = listLine.replace(/^(\d+\.\s+|[-*]\s+)/, "");
          items.push(itemText);
          index += 1;
        }
        blocks.push({
          type: "list",
          ordered,
          items,
        });
        continue;
      }

      const paragraphLines = [];
      while (index < lines.length && !isBlockStart(lines[index])) {
        if (lines[index].trim() === "") break;
        paragraphLines.push(lines[index].trim());
        index += 1;
      }
      if (paragraphLines.length) {
        blocks.push({
          type: "text",
          content: paragraphLines.join(" "),
        });
        continue;
      }

      index += 1;
    }

    return blocks;
  };

  return parseBlocks(false);
};

// Code block component with syntax highlighting
function CodeBlock({
  language,
  content,
  filename,
  isGrouped = false,
  isFirstInGroup = false,
  isLastInGroup = false,
}) {
  // Add animation styles once
  useEffect(() => {
    if (!document.getElementById("code-block-animations")) {
      const style = document.createElement("style");
      style.id = "code-block-animations";
      style.textContent = `
        @keyframes codeBlockExpand {
          from {
            max-height: 0;
            opacity: 0;
          }
          to {
            max-height: 5000px;
            opacity: 1;
          }
        }
        @keyframes codeBlockCollapse {
          from {
            max-height: 5000px;
            opacity: 1;
          }
          to {
            max-height: 0;
            opacity: 0;
          }
        }
        @keyframes codeChipSlideIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Map language names to Prism language identifiers
  const prismLanguage = language === "csharp" ? "csharp" : language || "text";
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Determine grouping styles
  const groupStyles = isGrouped
    ? {
        marginTop: isFirstInGroup ? "0.75rem" : "0",
        marginBottom: isLastInGroup ? "0.75rem" : "0",
        borderRadius:
          isFirstInGroup && isLastInGroup
            ? "6px"
            : isFirstInGroup
            ? "6px 6px 0 0"
            : isLastInGroup
            ? "0 0 6px 6px"
            : "0",
        borderTop: isFirstInGroup
          ? "1.5px solid color-mix(in hsl, canvasText, transparent 70%)"
          : "none",
        borderBottom:
          "1.5px solid color-mix(in hsl, canvasText, transparent 70%)",
        borderLeft:
          "1.5px solid color-mix(in hsl, canvasText, transparent 70%)",
        borderRight:
          "1.5px solid color-mix(in hsl, canvasText, transparent 70%)",
      }
    : {
        margin: "0.75rem 0",
        borderRadius: "6px",
        border: "1.5px solid color-mix(in hsl, canvasText, transparent 70%)",
      };

  return (
    <div
      style={{
        position: "relative",
        background: "color-mix(in hsl, canvasText, transparent 94%)",
        overflow: "hidden",
        animation: "codeChipSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 1px 3px color-mix(in hsl, canvasText, transparent 95%)",
        ...groupStyles,
      }}
    >
      <button
        type="button"
        onClick={() => setIsCollapsed((current) => !current)}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          background: "transparent",
          border: "none",
          color: "canvasText",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          minHeight: "48px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "color-mix(in hsl, canvasText, transparent 88%)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flex: 1,
            minWidth: 0,
          }}
        >
          {filename && (
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "canvasText",
                opacity: 0.95,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
              }}
            >
              {filename}
            </span>
          )}
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 500,
              color: "canvasText",
              opacity: 0.7,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              flexShrink: 0,
              padding: "0.125rem 0.5rem",
              borderRadius: "3px",
              background: "color-mix(in hsl, canvasText, transparent 92%)",
              border:
                "1px solid color-mix(in hsl, canvasText, transparent 80%)",
            }}
          >
            {language || "text"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            flexShrink: 0,
            borderRadius: "4px",
            background: "color-mix(in hsl, canvasText, transparent 90%)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              opacity: 0.8,
              transition: "opacity 0.2s ease",
            }}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      <div
        style={{
          overflow: "hidden",
          maxHeight: isCollapsed ? "0" : "none",
          transition:
            "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: isCollapsed ? 0 : 1,
          background: "color-mix(in hsl, canvasText, transparent 97%)",
          borderTop: isCollapsed
            ? "none"
            : "1px solid color-mix(in hsl, canvasText, transparent 85%)",
        }}
      >
        {!isCollapsed && (
          <div style={{ padding: "0.5rem" }}>
            <SyntaxHighlighter
              language={prismLanguage}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: "1rem",
                background: "color-mix(in hsl, canvasText, transparent 98%)",
                fontSize: "0.8125rem",
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                lineHeight: "1.6",
                borderRadius: "4px",
                border:
                  "1px solid color-mix(in hsl, canvasText, transparent 90%)",
              }}
              codeTagProps={{
                style: {
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                  fontSize: "0.8125rem",
                },
              }}
              PreTag="div"
            >
              {content}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
}

// Image component
function ContentImage({ src, alt, containerStyle, imageStyle }) {
  return (
    <div
      style={{
        margin: "1rem 0",
        borderRadius: "4px",
        overflow: "hidden",
        background: "color-mix(in hsl, canvasText, transparent 98%)",
        ...containerStyle,
      }}
    >
      <img
        src={src}
        alt={alt || "Development screenshot"}
        draggable="false"
        decoding="async"
        fetchPriority="low"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          userSelect: "none",
          ...imageStyle,
        }}
        loading="lazy"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    </div>
  );
}

const headingSizes = {
  1: { fontSize: "1.6rem", fontWeight: 700 },
  2: { fontSize: "1.3rem", fontWeight: 600 },
  3: { fontSize: "1.15rem", fontWeight: 600 },
  4: { fontSize: "1rem", fontWeight: 600 },
};

function MarkdownHeading({ level, content }) {
  const style = headingSizes[level] || headingSizes[3];
  return (
    <div
      style={{
        ...style,
        color: "canvasText",
        letterSpacing: "-0.01em",
        lineHeight: 1.2,
      }}
    >
      {renderInline(content)}
    </div>
  );
}

function MarkdownParagraph({ content }) {
  return (
    <p
      style={{
        margin: "0.75rem 0",
        fontSize: "0.875rem",
        lineHeight: "1.6",
        color: "canvasText",
        opacity: 0.9,
      }}
    >
      {renderInline(content)}
    </p>
  );
}

function MarkdownList({ ordered, items }) {
  const ListTag = ordered ? "ol" : "ul";
  return (
    <ListTag
      style={{
        margin: "0.75rem 0 0.75rem 1.25rem",
        padding: 0,
        fontSize: "0.875rem",
        lineHeight: "1.6",
        color: "canvasText",
        opacity: 0.9,
      }}
    >
      {items.map((item, index) => (
        <li key={index} style={{ marginBottom: "0.35rem" }}>
          {renderInline(item)}
        </li>
      ))}
    </ListTag>
  );
}

function MarkdownDivider() {
  return (
    <div
      style={{
        height: "1px",
        background: "color-mix(in hsl, canvasText, transparent 85%)",
        margin: "1rem 0",
      }}
    />
  );
}

function MarkdownCallout({ tone, children }) {
  const tones = {
    info: "color-mix(in hsl, canvasText, transparent 90%)",
    warning: "color-mix(in hsl, orange, transparent 88%)",
    success: "color-mix(in hsl, green, transparent 88%)",
    danger: "color-mix(in hsl, red, transparent 88%)",
  };
  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "4px",
        border: "1px solid color-mix(in hsl, canvasText, transparent 80%)",
        background:
          tones[tone] || "color-mix(in hsl, canvasText, transparent 95%)",
        margin: "0.75rem 0",
      }}
    >
      {children}
    </div>
  );
}

function MarkdownColumns({ columns }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        alignItems: "stretch",
        margin: "0.75rem 0",
      }}
    >
      {columns.map((column, index) => {
        const width = toCssWidth(column.width);
        return (
          <div
            key={index}
            style={{
              flex: width ? `0 0 ${width}` : "1 1 0",
              minWidth: "220px",
            }}
          >
            {column.content}
          </div>
        );
      })}
    </div>
  );
}

function MarkdownCarousel({ items }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        overflowX: "auto",
        paddingBottom: "0.5rem",
        margin: "0.75rem 0",
      }}
    >
      {items.map((item, index) => (
        <div key={index} style={{ flex: "0 0 240px" }}>
          {item}
        </div>
      ))}
    </div>
  );
}

// Group consecutive code blocks together
const groupCodeBlocks = (blocks) => {
  const grouped = [];
  let currentGroup = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (block.type === "code") {
      currentGroup.push(block);
    } else {
      // If we have a group, add it and reset
      if (currentGroup.length > 0) {
        grouped.push({ type: "codeGroup", blocks: currentGroup });
        currentGroup = [];
      }
      grouped.push(block);
    }
  }

  // Add any remaining group
  if (currentGroup.length > 0) {
    grouped.push({ type: "codeGroup", blocks: currentGroup });
  }

  return grouped;
};

const renderBlocks = (blocks) => {
  const groupedBlocks = groupCodeBlocks(blocks);

  return groupedBlocks.map((block, index) => {
    if (block.type === "codeGroup") {
      return (
        <div key={`code-group-${index}`} style={{ margin: "0.75rem 0" }}>
          {block.blocks.map((codeBlock, codeIndex) => (
            <CodeBlock
              key={`code-${index}-${codeIndex}`}
              language={codeBlock.language}
              content={codeBlock.content}
              filename={codeBlock.filename}
              isGrouped={block.blocks.length > 1}
              isFirstInGroup={codeIndex === 0}
              isLastInGroup={codeIndex === block.blocks.length - 1}
            />
          ))}
        </div>
      );
    }

    switch (block.type) {
      case "heading":
        return (
          <MarkdownHeading
            key={index}
            level={block.level || 2}
            content={block.content}
          />
        );
      case "text":
        return <MarkdownParagraph key={index} content={block.content} />;
      case "list":
        return (
          <MarkdownList
            key={index}
            ordered={block.ordered}
            items={block.items}
          />
        );
      case "divider":
        return <MarkdownDivider key={index} />;
      case "image":
        return <ContentImage key={index} src={block.src} alt={block.alt} />;
      case "code":
        return (
          <CodeBlock
            key={index}
            language={block.language}
            content={block.content}
            filename={block.filename}
            isGrouped={false}
          />
        );
      case "directive":
        return renderDirective(block, index);
      default:
        return null;
    }
  });
};

const renderDirective = (block, key) => {
  const name = block.name.toLowerCase();
  const attrs = block.attrs || {};
  const children = block.children || [];

  if (name === "columns") {
    const columnBlocks = children.filter(
      (child) =>
        child.type === "directive" && child.name.toLowerCase() === "column"
    );
    const columns = (
      columnBlocks.length ? columnBlocks : [{ attrs: {}, children }]
    ).map((col) => ({
      width: col.attrs?.width || col.attrs?.w,
      content: renderBlocks(col.children || []),
    }));
    return <MarkdownColumns key={key} columns={columns} />;
  }

  if (name === "column") {
    return <div key={key}>{renderBlocks(children)}</div>;
  }

  if (name === "callout") {
    return (
      <MarkdownCallout key={key} tone={attrs.tone || attrs.type}>
        {renderBlocks(children)}
      </MarkdownCallout>
    );
  }

  if (name === "carousel") {
    const items = children.length
      ? children.map((child, index) => {
          if (child.type === "image") {
            return (
              <ContentImage
                key={index}
                src={child.src}
                alt={child.alt}
                containerStyle={{ margin: 0 }}
              />
            );
          }
          return <div key={index}>{renderBlocks([child])}</div>;
        })
      : [];
    return <MarkdownCarousel key={key} items={items} />;
  }

  if (name === "youtube") {
    const videoId = getYouTubeId(attrs.id || attrs.url || attrs.link);
    if (!videoId) return null;
    const title = attrs.title || "YouTube video";
    return (
      <div
        key={key}
        style={{
          width: toCssWidth(attrs.width) || "100%",
          margin: "0.75rem 0",
        }}
      >
        <div
          style={{
            position: "relative",
            paddingTop: "56.25%",
            borderRadius: "4px",
            overflow: "hidden",
            background: "color-mix(in hsl, canvasText, transparent 95%)",
          }}
        >
          <iframe
            title={title}
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        </div>
      </div>
    );
  }

  if (name === "block") {
    const width = toCssWidth(attrs.width);
    const align = attrs.align || attrs.justify;
    const alignStyle =
      align === "center"
        ? { marginLeft: "auto", marginRight: "auto" }
        : align === "right"
        ? { marginLeft: "auto" }
        : null;
    return (
      <div key={key} style={{ width: width || "100%", ...alignStyle }}>
        {renderBlocks(children)}
      </div>
    );
  }

  return <div key={key}>{renderBlocks(children)}</div>;
};

export default function GameDevelopmentInfoWidget({ game }) {
  const markdown = useMemo(() => {
    if (!game?.id) return null;
    return getDevelopmentInfo(game.id);
  }, [game?.id]);

  const content = useMemo(() => {
    if (!markdown) return null;
    return parseMarkdown(markdown);
  }, [markdown]);

  const gameLinks = useMemo(() => {
    if (!game?.id) return [];
    return getGameLinks(game.id);
  }, [game?.id]);

  if (!content || content.length === 0) {
    return (
      <BaseWidget padding="1rem">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            color: "canvasText",
            opacity: 0.5,
            fontSize: "0.875rem",
            textAlign: "center",
          }}
        >
          <div>No development info available</div>
          <div
            style={{ fontSize: "0.75rem", marginTop: "0.5rem", opacity: 0.7 }}
          >
            Add content in src/content/gameDevelopment/{game?.id}.md
          </div>
        </div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget padding="1rem">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {gameLinks.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "1.25rem",
              paddingTop: "0.25rem",
              paddingBottom: "1.25rem",
              borderBottom: "1px solid color-mix(in hsl, canvasText, transparent 85%)",
            }}
          >
            {gameLinks.map((link, linkIndex) => (
              <a
                key={linkIndex}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.625rem 1rem",
                  borderRadius: "8px",
                  background: "color-mix(in hsl, canvasText, transparent 95%)",
                  border: "1.5px solid color-mix(in hsl, canvasText, transparent 60%)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "canvasText",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  userSelect: "none",
                  boxSizing: "border-box",
                  boxShadow: "0 2px 4px color-mix(in hsl, canvasText, transparent 90%)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "color-mix(in hsl, canvasText, transparent 92%)";
                  e.currentTarget.style.borderColor = "color-mix(in hsl, canvasText, transparent 70%)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px color-mix(in hsl, canvasText, transparent 85%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "color-mix(in hsl, canvasText, transparent 95%)";
                  e.currentTarget.style.borderColor = "color-mix(in hsl, canvasText, transparent 60%)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px color-mix(in hsl, canvasText, transparent 90%)";
                }}
              >
                {link.type === "steam" && renderSteamIcon("18")}
                {(link.type === "itch" || link.type === "itchio") && renderItchIcon("18")}
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        )}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            paddingRight: "0.5rem",
          }}
        >
          {renderBlocks(content)}
        </div>
      </div>
    </BaseWidget>
  );
}
