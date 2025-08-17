import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import Topbar from '../components/Topbar'
import ReactMarkdown from 'react-markdown'
import { Button } from '../components/Field'

export default function ViewSummary() {
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/history/summary/${id}`)
        setData(res.data)
      } catch (e) {
        setData({ error: 'Failed to load summary.' })
      }
    })()
  }, [id])

  if (!data) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Topbar />
      <div style={{ padding: 16 }}>Loading...</div>
    </div>
  )

  if (data.error) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Topbar />
      <div style={{ padding: 16, color: 'crimson' }}>{data.error}</div>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Topbar />
      <div style={{ padding: 16, maxWidth: 900 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{data.title || `Summary #${data.summaryId}`}</h2>
          <Link to="/"><Button variant="ghost">Back to Generate</Button></Link>
        </div>
        <div style={{ color: '#6b7280', marginBottom: 12 }}>
          Created: {new Date(data.createdAt).toLocaleString()}
          {data.updatedAt && <> • Updated: {new Date(data.updatedAt).toLocaleString()}</>}
          {data.sharedTo && <> • Shared To: {data.sharedTo}</>}
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, background: '#fafafa' }}>
          <ReactMarkdown>{data.summary || ''}</ReactMarkdown>
        </div>
        {data.prompt && (
          <div style={{ marginTop: 16, color: '#6b7280' }}>
            Prompt used: <code>{data.prompt}</code>
          </div>
        )}
      </div>
    </div>
  )
}
