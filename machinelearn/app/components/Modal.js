'use client'

import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, message, type = 'success' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      default:
        return 'ℹ'
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#1a1a1a', border: '#3ECF8E', text: '#ffffff', icon: '#3ECF8E', buttonBg: '#3ECF8E', buttonText: '#ffffff' }
      case 'error':
        return { bg: '#1a1a1a', border: '#ef4444', text: '#ffffff', icon: '#ef4444', buttonBg: '#ef4444', buttonText: '#ffffff' }
      case 'warning':
        return { bg: '#1a1a1a', border: '#f59e0b', text: '#ffffff', icon: '#f59e0b', buttonBg: '#f59e0b', buttonText: '#ffffff' }
      default:
        return { bg: '#1a1a1a', border: '#3b82f6', text: '#ffffff', icon: '#3b82f6', buttonBg: '#3b82f6', buttonText: '#ffffff' }
    }
  }

  const colors = getColors()

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease',
          border: '1px solid #2a2a2a'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '32px',
            color: colors.icon,
            boxShadow: `0 0 20px ${colors.border}30`
          }}
        >
          {getIcon()}
        </div>

        <h2
          style={{
            margin: '0 0 12px',
            fontSize: '22px',
            fontWeight: '700',
            color: colors.text
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: '0 0 24px',
            fontSize: '15px',
            color: '#9ca3af',
            lineHeight: '1.6'
          }}
        >
          {message}
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          style={{
            backgroundColor: colors.icon,
            color: '#ffffff',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: `0 4px 15px ${colors.border}30`
          }}
        >
          OK
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}