import { useMemo, useState } from 'react'
import BaseWidget from '../BaseWidget'
import { getDevelopmentInfo } from '../../../data/gameDevelopmentInfo'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

/* eslint-disable react/prop-types */

// Code block component with syntax highlighting
function CodeBlock({
  language,
  content,
  headerContent,
  collapsible = false,
  defaultCollapsed = false,
  containerStyle
}) {
  // Map language names to Prism language identifiers
  const prismLanguage = language === 'csharp' ? 'csharp' : language || 'text'
  const showHeader = headerContent !== undefined ? Boolean(headerContent) : Boolean(language)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const resolvedCollapsed = isCollapsed
  const headerStyle = headerContent
    ? {
        padding: '0.5rem 0.75rem',
        borderBottom: '1px solid color-mix(in hsl, canvasText, transparent 85%)'
      }
    : {
        padding: '0.5rem 0.75rem',
        fontSize: '0.75rem',
        color: 'canvasText',
        opacity: 0.6,
        borderBottom: '1px solid color-mix(in hsl, canvasText, transparent 85%)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }

  const headerBody = headerContent || language
  const collapsedContainerStyle = collapsible && resolvedCollapsed
    ? {
        display: 'inline-block',
        width: 'fit-content',
        maxWidth: '100%',
        marginRight: '0.5rem'
      }
    : null

  return (
    <div style={{
      position: 'relative',
      margin: '1rem 0',
      borderRadius: '4px',
      overflow: 'hidden',
      background: 'color-mix(in hsl, canvasText, transparent 95%)',
      border: '1px solid color-mix(in hsl, canvasText, transparent 85%)',
      ...collapsedContainerStyle,
      ...containerStyle
    }}>
      {showHeader && (
        collapsible ? (
          <button
            type="button"
            onClick={() => {
              setIsCollapsed((current) => !current)
            }}
            style={{
              ...headerStyle,
              width: '100%',
              background: 'transparent',
              color: 'canvasText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              cursor: 'pointer',
              border: 'none',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{headerBody}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              {resolvedCollapsed ? '>' : 'v'}
            </span>
          </button>
        ) : (
          <div style={headerStyle}>
            {headerBody}
          </div>
        )
      )}
      {!collapsible || !resolvedCollapsed ? (
        <SyntaxHighlighter
          language={prismLanguage}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.8125rem',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            lineHeight: '1.5'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
              fontSize: '0.8125rem'
            }
          }}
          PreTag="div"
        >
          {content}
        </SyntaxHighlighter>
      ) : null}
    </div>
  )
}

// Image component
function ContentImage({ src, alt }) {
  return (
    <div style={{
      margin: '1rem 0',
      borderRadius: '4px',
      overflow: 'hidden',
      background: 'color-mix(in hsl, canvasText, transparent 98%)'
    }}>
      <img
        src={src}
        alt={alt || 'Development screenshot'}
        draggable="false"
        decoding="async"
        fetchPriority="low"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          userSelect: 'none'
        }}
        loading="lazy"
        onError={(e) => {
          e.target.style.display = 'none'
        }}
      />
    </div>
  )
}

// Heading component
function ContentHeading({ level, content }) {
  const fontSize = level === 1 ? '1.5rem' : level === 2 ? '1.25rem' : '1.125rem'
  const fontWeight = level === 1 ? 700 : level === 2 ? 600 : 600
  //const marginTop = level === 1 ? '1.5rem' : level === 2 ? '1.25rem' : '1rem'
  
  return (
    <div
      style={{
        fontSize,
        fontWeight,
        color: 'canvasText',
        //marginTop,
        marginBottom: '0.75rem',
        letterSpacing: '-0.01em',
        lineHeight: 1.2
      }}
    >
      {content}
    </div>
  )
}

// Text paragraph component
function ContentText({ content }) {
  return (
    <p style={{
      margin: '0.75rem 0',
      fontSize: '0.875rem',
      lineHeight: '1.6',
      color: 'canvasText',
      opacity: 0.9
    }}>
      {content}
    </p>
  )
}

export default function GameDevelopmentInfoWidget({ game }) {
  const content = useMemo(() => {
    if (!game?.id) return null
    return getDevelopmentInfo(game.id)
  }, [game?.id])

  if (!content || content.length === 0) {
    return (
      <BaseWidget padding="1rem">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'canvasText',
          opacity: 0.5,
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          <div>No development info available</div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
            Add content in gameDevelopmentInfo.js
          </div>
        </div>
      </BaseWidget>
    )
  }

  return (
    <BaseWidget padding="1rem">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {/* <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          margin: 0,
          marginBottom: '1rem',
          letterSpacing: '-0.01em',
          color: 'canvasText',
          flexShrink: 0
        }}>
          Development Info
        </h3> */}
        <div style={{
          flex: 1,
          minHeight: 0,
          paddingRight: '1rem'
        }}>
          {content.map((item, index) => {
            switch (item.type) {
              case 'heading':
                return <ContentHeading key={index} level={item.level || 2} content={item.content} />
              case 'text':
                return <ContentText key={index} content={item.content} />
              case 'image':
                return <ContentImage key={index} src={item.src} alt={item.alt} />
              case 'code':
                return (
                  <CodeBlock
                    key={index}
                    language={item.language}
                    content={item.content}
                    headerContent={(
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.75rem',
                          color: 'canvasText',
                          opacity: 0.7
                        }}
                      >
                        <span>{item.filename || item.title || 'Code'}</span>
                        <span style={{ opacity: 0.55 }}>{item.language || 'text'}</span>
                      </div>
                    )}
                    collapsible
                    defaultCollapsed
                  />
                )
              default:
                return null
            }
          })}
        </div>
      </div>
    </BaseWidget>
  )
}

