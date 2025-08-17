import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Topbar from '../components/Topbar'
import Toast from '../components/Toast'

export default function History() {
  const [items, setItems] = useState([])
  const [toast, setToast] = useState({ msg: '', type: 'info' })
  const show = (msg, type='info') => setToast({ msg, type })

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/history/summaries')
        setItems(res.data || [])
      } catch (e) {
        show('Failed to load history.', 'error')
      }
    })()
  }, [])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Topbar />
      <div style={{ padding: 16 }}>
        <h2>History</h2>
        <div style={{ border: '1px solid #eee', borderRadius: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1.6fr 1fr 1fr', padding: '10px 12px', borderBottom: '1px solid #eee', fontWeight: 600 }}>
            <div>ID</div><div>Title</div><div>Created</div><div>Shared To</div>
          </div>
          {items.map(row => (
            <Link key={row.summaryId} to={`/summary/${row.summaryId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1.6fr 1fr 1fr', padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                <div>{row.summaryId}</div>
                <div title={row.title}>{row.title}</div>
                <div>{new Date(row.createdAt).toLocaleString()}</div>
                <div style={{ color: '#374151' }}>{row.sharedTo || (row.hasEdits ? 'Edited' : '')}</div>
              </div>
            </Link>
          ))}
          {!items.length && (
            <div style={{ padding: 16, color: '#6b7280' }}>No history yet.</div>
          )}
        </div>
      </div>
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'info' })} />
    </div>
  )
}
