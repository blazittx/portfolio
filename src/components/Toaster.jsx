import { useEffect, useState } from 'react'

/* eslint-disable react/prop-types */
export default function Toaster({ toasts, onRemove }) {
  const [visibleToasts, setVisibleToasts] = useState([])

  useEffect(() => {
    setVisibleToasts(toasts)
  }, [toasts])

  if (visibleToasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none'
      }}
    >
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            color: 'canvasText',
            fontSize: '0.875rem',
            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            minWidth: '200px',
            maxWidth: '400px',
            pointerEvents: 'auto',
            animation: 'toastSlideIn 0.3s ease-out',
            cursor: 'pointer'
          }}
          onClick={() => onRemove(toast.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}



