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
        return { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: '#28a745' }
      case 'error':
        return { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: '#dc3545' }
      case 'warning':
        return { bg: '#fff3cd', border: '#ffeeba', text: '#856404', icon: '#ffc107' }
      default:
        return { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: '#17a2b8' }
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
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease'
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
            color: colors.icon
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
            color: '#495057',
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
            color: '#fff',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
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