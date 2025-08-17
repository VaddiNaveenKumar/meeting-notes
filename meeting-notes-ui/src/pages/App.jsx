import { useEffect, useState } from 'react'
import api from '../api'
import Toast from '../components/Toast'
import Topbar from '../components/Topbar'
import { Label, Input, TextArea, Button } from '../components/Field'
import ReactMarkdown from 'react-markdown'

function bytesToReadable(n) {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  return `${(n / 1024 / 1024).toFixed(2)}MB`
}

export default function App() {
  const [title, setTitle] = useState('')
  const [transcriptText, setTranscriptText] = useState('')
  const [prompt, setPrompt] = useState('Summarize with: Summary, Action Items(with owner & due), Decisions, Risks, Next Steps. Scale depth to input size/complexity. Use Markdown headings. Propose owners/dates if missing (mark as proposed).')
  const [summary, setSummary] = useState('')
  const [summaryId, setSummaryId] = useState(null)
  const [transcriptId, setTranscriptId] = useState(null)
  const [recipients, setRecipients] = useState('')
  const [subject, setSubject] = useState('Meeting Summary')
  const [toast, setToast] = useState({ msg: '', type: 'info' })
  const [loading, setLoading] = useState(false)
  const [previewMd, setPreviewMd] = useState(false)
  const [uploadInfo, setUploadInfo] = useState('')

  const MAX_UPLOAD_BYTES = 30 * 1024 * 1024 // 30MB

  const show = (msg, type='info') => setToast({ msg, type })

  useEffect(() => {
    const existing = localStorage.getItem('ms_user_id')
    if (!existing) {
      const id = 'user-' + Math.random().toString(36).slice(2, 8)
      localStorage.setItem('ms_user_id', id)
      show(`Using temporary user id: ${id}`, 'info')
    }
  }, [])

  const handleFileUpload = async (e) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return
      if (file.size > MAX_UPLOAD_BYTES) {
        show(`File too large (${bytesToReadable(file.size)}). Max: ${bytesToReadable(MAX_UPLOAD_BYTES)}.`, 'error')
        return
      }
      const text = await file.text()
      setTranscriptText(text)
      setUploadInfo(`${file.name} • ${bytesToReadable(file.size)}`)
      if (!title.trim()) {
        const base = file.name.replace(/\.[^/.]+$/, '')
        setTitle(base.slice(0, 60))
      }
      show('Transcript loaded from file.', 'success')
    } catch {
      show('Failed to read file.', 'error')
    }
  }

  const generateSummary = async () => {
    if (!transcriptText.trim() || !prompt.trim()) {
      show('Transcript and prompt are required.', 'error')
      return
    }
    // Client-side length guard (approx)
    const bytes = new Blob([transcriptText]).size
    if (bytes > MAX_UPLOAD_BYTES) {
      show(`Transcript too large (${bytesToReadable(bytes)}). Max: ${bytesToReadable(MAX_UPLOAD_BYTES)}.`, 'error')
      return
    }

    setLoading(true)
    try {
      const payload = { transcriptText, prompt }
      if (title.trim()) payload.title = title.trim()

      const res = await api.post('/api/summary/generate', payload)
      setSummary(res.data.summary || '')
      setSummaryId(res.data.summaryId || null)
      setTranscriptId(res.data.transcriptId || null)
      show('Summary generated.', 'success')
    } catch (e) {
      const m = e.response?.data?.message || e.response?.data?.error || e.message
      show(`Error generating summary: ${m}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveEdits = async () => {
    if (!summaryId) {
      show('No summary to save. Generate first.', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await api.put('/api/summary/update', {
        summaryId,
        editedSummary: summary
      })
      setSummary(res.data.summary || '')
      show('Edits saved.', 'success')
    } catch (e) {
      const m = e.response?.data?.message || e.response?.data?.error || e.message
      show(`Error saving edits: ${m}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async () => {
    if (!summaryId) {
      show('Generate and save a summary first.', 'error')
      return
    }
    const to = recipients.split(',').map(s => s.trim()).filter(Boolean)
    if (!to.length) {
      show('Enter at least one recipient email.', 'error')
      return
    }
    setLoading(true)
    try {
      const inner = `
        <div style="font-size:15px;line-height:1.6;">
          ${previewMd
            ? `<div>${escapeHtml(summary).replace(/\n/g,'<br/>')}</div>`
            : `<pre style="white-space:pre-wrap;font-family:inherit;margin:0">${escapeHtml(summary)}</pre>`}
        </div>
      `
      await api.post(`/api/email/send/${summaryId}`, { to, subject, bodyHtml: inner })
      show('Email sent.', 'success')
    } catch (e) {
      const m = e.response?.data?.message || e.response?.data?.error || e.message
      show(`Error sending email: ${m}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const escapeHtml = (input) => {
    if (!input) return ''
    return input.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Topbar />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, padding: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
            <Label>Title (for History)</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Sprint Review 2025-08-17" />
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Label>Transcript</Label>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{uploadInfo}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="file" accept=".txt" onChange={handleFileUpload} />
              <div style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
                Max {bytesToReadable(MAX_UPLOAD_BYTES)}. Paste also supported.
              </div>
            </div>
            <TextArea rows={12} value={transcriptText} onChange={e => setTranscriptText(e.target.value)} placeholder="Paste or upload your meeting transcript here..." />
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
            <Label>Custom Instruction / Prompt</Label>
            <Input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder='e.g., "Executive brief with owners and dates; scale depth to input."' />
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Button onClick={generateSummary} disabled={loading}>{loading ? 'Generating...' : 'Generate Summary'}</Button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Label>Summary</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" onClick={() => setPreviewMd(!previewMd)}>{previewMd ? 'Edit' : 'Preview'}</Button>
                <Button variant="secondary" onClick={saveEdits} disabled={loading || !summaryId}>{loading ? 'Saving...' : 'Save Edits'}</Button>
              </div>
            </div>
            {!previewMd ? (
              <TextArea rows={14} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summary will appear here. You can edit before sending email." />
            ) : (
              <div style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 12, minHeight: 260, overflow: 'auto', background: '#fafafa' }}>
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            )}
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
            <Label>Share via Email</Label>
            <Input value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="Recipients (comma-separated)" />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button onClick={sendEmail} disabled={loading || !summaryId}>{loading ? 'Sending...' : 'Send Email'}</Button>
            </div>
          </div>
        </div>
      </div>

      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'info' })} />
    </div>
  )
}
