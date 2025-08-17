export function Label({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{children}</div>
}

export function Input(props) {
  return <input {...props} style={{
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', outline: 'none'
  }} />
}

export function TextArea(props) {
  return <textarea {...props} style={{
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', outline: 'none'
  }} />
}

export function Button({ children, variant='primary', ...rest }) {
  const styles = variant === 'primary'
    ? { background: '#111827', color: '#fff', border: '1px solid #111827' }
    : variant === 'ghost'
      ? { background: 'transparent', color: '#111827', border: '1px solid #e5e7eb' }
      : { background: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb' }
  return (
    <button {...rest} style={{
      padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, ...styles
    }}>
      {children}
    </button>
  )
}
