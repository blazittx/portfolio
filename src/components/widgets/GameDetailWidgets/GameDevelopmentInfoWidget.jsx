import { useMemo, useState } from 'react'
import BaseWidget from '../BaseWidget'
import { getDevelopmentInfo } from '../../../data/gameDevelopmentInfo'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

/* eslint-disable react/prop-types */

const codeSamples = import.meta.glob('../../../codeSamples/**/*', {
  as: 'raw',
  eager: true
})

const getCodeSample = (filename) => {
  return codeSamples[`../../../codeSamples/${filename}`] || ''
}

const parseAttributes = (raw) => {
  if (!raw) return {}
  return raw
    .trim()
    .split(/\s+/)
    .reduce((attrs, part) => {
      if (!part.includes('=')) return attrs
      const [key, value] = part.split('=')
      if (!key) return attrs
      const cleanValue = value ? value.replace(/^['"]|['"]$/g, '') : ''
      attrs[key] = cleanValue
      return attrs
    }, {})
}

const parseCodeInfo = (info) => {
  const tokens = info.trim().split(/\s+/).filter(Boolean)
  let language = ''
  const attrTokens = []
  tokens.forEach((token) => {
    if (token.includes('=')) {
      attrTokens.push(token)
      return
    }
    if (!language) {
      language = token
      return
    }
    attrTokens.push(token)
  })
  return {
    language,
    attrs: parseAttributes(attrTokens.join(' '))
  }
}

const parseDirectiveLine = (line) => {
  const match = line.match(/^:::\s*([a-zA-Z0-9_-]+)(.*)$/)
  if (!match) return null
  return {
    name: match[1],
    attrs: parseAttributes(match[2] || '')
  }
}

const toCssWidth = (value) => {
  if (!value) return null
  if (value.endsWith('%') || value.endsWith('px') || value.endsWith('rem')) {
    return value
  }
  if (/^\d+$/.test(value)) {
    return `${value}%`
  }
  return value
}

const renderInline = (text) => {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  const elements = []
  let lastIndex = 0
  let match

  while ((match = tokenRegex.exec(text))) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**')) {
      elements.push(<strong key={`${match.index}-bold`}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      elements.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith('`')) {
      elements.push(
        <code
          key={`${match.index}-code`}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            background: 'color-mix(in hsl, canvasText, transparent 90%)',
            padding: '0.1rem 0.25rem',
            borderRadius: '3px',
            fontSize: '0.85em'
          }}
        >
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        elements.push(
          <a
            key={`${match.index}-link`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            {linkMatch[1]}
          </a>
        )
      } else {
        elements.push(token)
      }
    } else {
      elements.push(token)
    }
    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex))
  }

  return elements.length ? elements : text
}

const isBlockStart = (line) => {
  const trimmed = line.trim()
  return (
    trimmed.startsWith('#') ||
    trimmed.startsWith('```') ||
    trimmed.startsWith(':::') ||
    trimmed === '---' ||
    /^!\[.*\]\(.*\)$/.test(trimmed) ||
    /^[-*]\s+/.test(trimmed) ||
    /^\d+\.\s+/.test(trimmed)
  )
}

const parseMarkdown = (markdown) => {
  const lines = markdown.split(/\r?\n/)
  let index = 0

  const parseBlocks = (stopOnDirectiveEnd = false) => {
    const blocks = []

    while (index < lines.length) {
      const rawLine = lines[index]
      const line = rawLine.trimEnd()

      if (stopOnDirectiveEnd && line.trim() === ':::') {
        index += 1
        break
      }

      if (line.trim() === '') {
        index += 1
        continue
      }

      if (line.startsWith('```')) {
        const info = line.slice(3).trim()
        const { language, attrs } = parseCodeInfo(info)
        index += 1
        const codeLines = []
        while (index < lines.length && !lines[index].trimStart().startsWith('```')) {
          codeLines.push(lines[index])
          index += 1
        }
        if (index < lines.length) {
          index += 1
        }
        const filename = attrs.file || attrs.filename
        const inlineContent = codeLines.join('\n')
        const content = filename ? (getCodeSample(filename) || inlineContent) : inlineContent
        blocks.push({
          type: 'code',
          language: attrs.lang || language || 'text',
          content,
          filename
        })
        continue
      }

      if (line.startsWith(':::')) {
        const directive = parseDirectiveLine(line)
        index += 1
        const children = parseBlocks(true)
        if (directive) {
          blocks.push({
            type: 'directive',
            name: directive.name,
            attrs: directive.attrs,
            children
          })
        }
        continue
      }

      if (line.startsWith('#')) {
        const match = line.match(/^(#{1,6})\s+(.*)$/)
        if (match) {
          blocks.push({
            type: 'heading',
            level: match[1].length,
            content: match[2]
          })
          index += 1
          continue
        }
      }

      if (line.trim() === '---') {
        blocks.push({ type: 'divider' })
        index += 1
        continue
      }

      if (/^!\[.*\]\(.*\)$/.test(line.trim())) {
        const imageMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
        if (imageMatch) {
          blocks.push({
            type: 'image',
            alt: imageMatch[1],
            src: imageMatch[2]
          })
          index += 1
          continue
        }
      }

      if (/^[-*]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim())) {
        const ordered = /^\d+\.\s+/.test(line.trim())
        const items = []
        while (index < lines.length) {
          const listLine = lines[index].trim()
          if (listLine === '') {
            index += 1
            break
          }
          if (ordered && !/^\d+\.\s+/.test(listLine)) break
          if (!ordered && !/^[-*]\s+/.test(listLine)) break
          const itemText = listLine.replace(/^(\d+\.\s+|[-*]\s+)/, '')
          items.push(itemText)
          index += 1
        }
        blocks.push({
          type: 'list',
          ordered,
          items
        })
        continue
      }

      const paragraphLines = []
      while (index < lines.length && !isBlockStart(lines[index])) {
        if (lines[index].trim() === '') break
        paragraphLines.push(lines[index].trim())
        index += 1
      }
      if (paragraphLines.length) {
        blocks.push({
          type: 'text',
          content: paragraphLines.join(' ')
        })
        continue
      }

      index += 1
    }

    return blocks
  }

  return parseBlocks(false)
}

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
function ContentImage({ src, alt, containerStyle, imageStyle }) {
  return (
    <div style={{
      margin: '1rem 0',
      borderRadius: '4px',
      overflow: 'hidden',
      background: 'color-mix(in hsl, canvasText, transparent 98%)',
      ...containerStyle
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
          userSelect: 'none',
          ...imageStyle
        }}
        loading="lazy"
        onError={(e) => {
          e.target.style.display = 'none'
        }}
      />
    </div>
  )
}

const headingSizes = {
  1: { fontSize: '1.6rem', fontWeight: 700 },
  2: { fontSize: '1.3rem', fontWeight: 600 },
  3: { fontSize: '1.15rem', fontWeight: 600 },
  4: { fontSize: '1rem', fontWeight: 600 }
}

function MarkdownHeading({ level, content }) {
  const style = headingSizes[level] || headingSizes[3]
  return (
    <div
      style={{
        ...style,
        color: 'canvasText',
        marginBottom: '0.75rem',
        letterSpacing: '-0.01em',
        lineHeight: 1.2
      }}
    >
      {renderInline(content)}
    </div>
  )
}

function MarkdownParagraph({ content }) {
  return (
    <p style={{
      margin: '0.75rem 0',
      fontSize: '0.875rem',
      lineHeight: '1.6',
      color: 'canvasText',
      opacity: 0.9
    }}>
      {renderInline(content)}
    </p>
  )
}

function MarkdownList({ ordered, items }) {
  const ListTag = ordered ? 'ol' : 'ul'
  return (
    <ListTag style={{
      margin: '0.75rem 0 0.75rem 1.25rem',
      padding: 0,
      fontSize: '0.875rem',
      lineHeight: '1.6',
      color: 'canvasText',
      opacity: 0.9
    }}>
      {items.map((item, index) => (
        <li key={index} style={{ marginBottom: '0.35rem' }}>
          {renderInline(item)}
        </li>
      ))}
    </ListTag>
  )
}

function MarkdownDivider() {
  return (
    <div
      style={{
        height: '1px',
        background: 'color-mix(in hsl, canvasText, transparent 85%)',
        margin: '1rem 0'
      }}
    />
  )
}

function MarkdownCallout({ tone, children }) {
  const tones = {
    info: 'color-mix(in hsl, canvasText, transparent 90%)',
    warning: 'color-mix(in hsl, orange, transparent 88%)',
    success: 'color-mix(in hsl, green, transparent 88%)',
    danger: 'color-mix(in hsl, red, transparent 88%)'
  }
  return (
    <div style={{
      padding: '0.75rem 1rem',
      borderRadius: '6px',
      border: '1px solid color-mix(in hsl, canvasText, transparent 80%)',
      background: tones[tone] || 'color-mix(in hsl, canvasText, transparent 95%)',
      margin: '0.75rem 0'
    }}>
      {children}
    </div>
  )
}

function MarkdownColumns({ columns }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      alignItems: 'stretch',
      margin: '0.75rem 0'
    }}>
      {columns.map((column, index) => {
        const width = toCssWidth(column.width)
        return (
          <div
            key={index}
            style={{
              flex: width ? `0 0 ${width}` : '1 1 0',
              minWidth: '220px'
            }}
          >
            {column.content}
          </div>
        )
      })}
    </div>
  )
}

function MarkdownCarousel({ items }) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.75rem',
      overflowX: 'auto',
      paddingBottom: '0.5rem',
      margin: '0.75rem 0'
    }}>
      {items.map((item, index) => (
        <div key={index} style={{ flex: '0 0 240px' }}>
          {item}
        </div>
      ))}
    </div>
  )
}

const renderBlocks = (blocks) => {
  return blocks.map((block, index) => {
    switch (block.type) {
      case 'heading':
        return (
          <MarkdownHeading
            key={index}
            level={block.level || 2}
            content={block.content}
          />
        )
      case 'text':
        return <MarkdownParagraph key={index} content={block.content} />
      case 'list':
        return (
          <MarkdownList
            key={index}
            ordered={block.ordered}
            items={block.items}
          />
        )
      case 'divider':
        return <MarkdownDivider key={index} />
      case 'image':
        return <ContentImage key={index} src={block.src} alt={block.alt} />
      case 'code': {
        const headerLabel = block.filename || 'Code'
        return (
          <CodeBlock
            key={index}
            language={block.language}
            content={block.content}
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
                <span>{headerLabel}</span>
                <span style={{ opacity: 0.55 }}>{block.language || 'text'}</span>
              </div>
            )}
            collapsible
            defaultCollapsed
          />
        )
      }
      case 'directive':
        return renderDirective(block, index)
      default:
        return null
    }
  })
}

const renderDirective = (block, key) => {
  const name = block.name.toLowerCase()
  const attrs = block.attrs || {}
  const children = block.children || []

  if (name === 'columns') {
    const columnBlocks = children.filter(
      (child) => child.type === 'directive' && child.name.toLowerCase() === 'column'
    )
    const columns = (columnBlocks.length ? columnBlocks : [{ attrs: {}, children }]).map((col) => ({
      width: col.attrs?.width || col.attrs?.w,
      content: renderBlocks(col.children || [])
    }))
    return <MarkdownColumns key={key} columns={columns} />
  }

  if (name === 'column') {
    return (
      <div key={key}>
        {renderBlocks(children)}
      </div>
    )
  }

  if (name === 'callout') {
    return (
      <MarkdownCallout key={key} tone={attrs.tone || attrs.type}>
        {renderBlocks(children)}
      </MarkdownCallout>
    )
  }

  if (name === 'carousel') {
    const items = children.length
      ? children.map((child, index) => {
          if (child.type === 'image') {
            return (
              <ContentImage
                key={index}
                src={child.src}
                alt={child.alt}
                containerStyle={{ margin: 0 }}
              />
            )
          }
          return <div key={index}>{renderBlocks([child])}</div>
        })
      : []
    return <MarkdownCarousel key={key} items={items} />
  }

  if (name === 'block') {
    const width = toCssWidth(attrs.width)
    const align = attrs.align || attrs.justify
    const alignStyle = align === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : align === 'right'
        ? { marginLeft: 'auto' }
        : null
    return (
      <div key={key} style={{ width: width || '100%', ...alignStyle }}>
        {renderBlocks(children)}
      </div>
    )
  }

  return (
    <div key={key}>
      {renderBlocks(children)}
    </div>
  )
}

export default function GameDevelopmentInfoWidget({ game }) {
  const markdown = useMemo(() => {
    if (!game?.id) return null
    return getDevelopmentInfo(game.id)
  }, [game?.id])

  const content = useMemo(() => {
    if (!markdown) return null
    return parseMarkdown(markdown)
  }, [markdown])

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
            Add content in src/content/gameDevelopment/{game?.id}.md
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
          {renderBlocks(content)}
        </div>
      </div>
    </BaseWidget>
  )
}

