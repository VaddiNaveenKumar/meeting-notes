import { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const id = setTimeout(() => onClose && onClose(), 4000)
    return () => clearTimeout(id)
  }, [message, onClose])

  if (!message) return null

  const bg = type === 'error' ? '#fde2e2' : type === 'success' ? '#e3f7e9' : '#e8f0fe'
  const color = type === 'error' ? '#8b0000' : type === 'success' ? '#085f2a' : '#1a3c8b'
  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, background: bg, color,
      padding: '12px 14px', borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
      maxWidth: 420, zIndex: 9999
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>{message}</div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color, cursor: 'pointer', fontWeight: 600
        }}>×</button>
      </div>
    </div>
  )
}
