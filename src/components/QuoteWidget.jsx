import { useState, useEffect } from 'react'
import BaseWidget from './BaseWidget'

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
  { text: "The best way to get a project done faster is to start sooner.", author: "Jim Highsmith" },
  { text: "The most disastrous thing that you can ever learn is your first programming language.", author: "Alan Kay" },
]

export default function QuoteWidget() {
  const [quote, setQuote] = useState(QUOTES[0])
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    // Change quote every 15 seconds
    const interval = setInterval(() => {
      setIsChanging(true)
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * QUOTES.length)
        setQuote(QUOTES[randomIndex])
        setIsChanging(false)
      }, 300)
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '0.75rem',
  }

  const quoteStyle = {
    fontSize: '0.875rem',
    lineHeight: 1.6,
    color: 'var(--color-canvas-text, #ffffff)',
    opacity: isChanging ? 0.5 : 0.9,
    margin: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    paddingRight: '4px',
    overflowY: 'auto',
    fontStyle: 'italic',
    transition: 'opacity 0.3s ease',
  }

  const authorStyle = {
    fontSize: '0.75rem',
    color: 'var(--color-canvas-text, #ffffff)',
    opacity: 0.6,
    margin: 0,
    flexShrink: 0,
    textAlign: 'right',
    paddingRight: '4px',
  }

  return (
    <BaseWidget padding="1rem 0.75rem 1rem 1rem">
      <div style={containerStyle}>
        <p style={quoteStyle}>"{quote.text}"</p>
        <p style={authorStyle}>— {quote.author}</p>
      </div>
    </BaseWidget>
  )
}


