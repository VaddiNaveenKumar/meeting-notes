import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore.js'
import { cn } from '../lib/utils.js'
import {
  Upload, FileText, Wand2, Copy, Check,
  Save, RotateCcw, ChevronDown, Trash2, Edit3, Send, X, Mail, Download, MessageCircle,
  PanelLeft, PanelRight
} from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { useDropzone } from 'react-dropzone'
import Topbar from '../components/Topbar.jsx'
import AuthModal from '../components/AuthModal.jsx'
import CommandPalette from '../components/CommandPalette.jsx'
import NotionModal from '../components/NotionModal.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import StreamingOutput from '../components/StreamingOutput.jsx'
import TipTapEditor from '../components/TipTapEditor.jsx'
import Toast from '../components/Toast.jsx'
import api from '../api.js'

function bytesToReadable(n) {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  return `${(n / 1024 / 1024).toFixed(2)}MB`
}

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024

const inputPanelVariants = {
  full:    { flex: 1.1, opacity: 1 },
  compact: { flex: 0.28, opacity: 0.8 },
}
const outputPanelVariants = {
  normal:  { flex: 0.9 },
  focused: { flex: 1.7 },
}
function ShareModal({ isOpen, onClose, summaryId, show }) {
  const { summary } = useStore()
  const [recipients, setRecipients] = useState('')
  const [subject, setSubject] = useState('Meeting Summary')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (isOpen) { setRecipients(''); setSent(false) }
  }, [isOpen])

  const sendEmail = async () => {
    const to = recipients.split(',').map(s => s.trim()).filter(Boolean)
    if (!to.length) { show('Enter at least one recipient email.', 'error'); return }
    setLoading(true)
    try {
      await api.post(`/api/email/send/${summaryId}`, { to, subject, bodyHtml: summary })
      setSent(true)
      show('Email sent successfully!', 'success')
      setTimeout(onClose, 1500)
    } catch (e) {
      show(`Failed to send: ${e.response?.data?.message || e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="share-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="share-modal"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4"
          >
            <div className={cn(
              'rounded-2xl border shadow-2xl overflow-hidden',
              'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700'
            )}>
              <div className="h-1 w-full bg-gradient-to-r from-accent-400 via-accent-600 to-violet-600" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center">
                      <Mail size={16} className="text-accent-600 dark:text-accent-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">Share Summary</h3>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Send via email</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer border-0 bg-transparent text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all">
                    <X size={16} />
                  </button>
                </div>

                {sent ? (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                      <Check size={24} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="font-semibold text-surface-800 dark:text-surface-100">Sent!</p>
                    <p className="text-sm text-surface-500 mt-1">Your summary has been delivered.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5 uppercase tracking-wider">
                        Recipients
                      </label>
                      <input
                        type="text"
                        value={recipients}
                        onChange={e => setRecipients(e.target.value)}
                        placeholder="alice@co.com, bob@co.com"
                        className={cn(
                          'w-full px-3 py-2.5 rounded-lg text-sm border outline-none',
                          'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700',
                          'text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-600',
                          'focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 transition-all'
                        )}
                      />
                      <p className="text-xs text-surface-400 dark:text-surface-600 mt-1">Separate multiple emails with commas</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5 uppercase tracking-wider">
                        Subject line
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className={cn(
                          'w-full px-3 py-2.5 rounded-lg text-sm border outline-none',
                          'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700',
                          'text-surface-900 dark:text-surface-100',
                          'focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 transition-all'
                        )}
                      />
                    </div>
                    <button
                      onClick={sendEmail}
                      disabled={loading || !recipients.trim()}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg mt-1',
                        'text-sm font-semibold text-white cursor-pointer border-0',
                        'bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed',
                        'transition-all duration-150 shadow-sm'
                      )}
                    >
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                        : <><Send size={14} /> Send Email</>
                      }
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
export default function App() {
  const {
    isStreaming, setIsStreaming,
    streamDone, setStreamDone,
    summary, setSummary, appendSummary, resetSummary,
    summaryId, setSummaryId,
    setTranscriptId,
    focusMode, setFocusMode,
    userEmail, setUserEmail,
    openAuthModal,
  } = useStore()

  const [title, setTitle] = useState('')
  const [transcriptText, setTranscriptText] = useState('')

  const TEMPLATES = [
    { id: 'standard', name: 'Standard (Default)', prompt: 'Summarize with: Summary, Action Items (with owner & due date), Decisions, Risks, Next Steps. Use Markdown headings. Scale depth to complexity.' },
    { id: 'executive', name: 'Executive Summary', prompt: 'Provide a very brief executive summary of this meeting. Highlight only the core purpose, the final outcomes, and the critical action items. Be extremely concise.' },
    { id: 'action', name: 'Action Items Only', prompt: 'Extract ONLY the action items from this transcript. Format as a bulleted list with Owner, Task, and Due Date.' },
    { id: 'engineering', name: 'Engineering Sync', prompt: 'Summarize this engineering meeting. Focus heavily on technical decisions, pull requests, architectural changes, bugs, and blockers.' }
  ]
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0])
  const [prompt, setPrompt] = useState(TEMPLATES[0].prompt)
  const [uploadInfo, setUploadInfo] = useState('')
  const [toast, setToast] = useState({ msg: '', type: 'info' })
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showChat, setShowChat] = useState(false)
  // Mobile: which panel is visible ('input' or 'output')
  const [mobileTab, setMobileTab] = useState('input')

  const show = (msg, type = 'info') => setToast({ msg, type })

  useEffect(() => {
    const storedEmail = localStorage.getItem('ms_user_email')
    if (storedEmail && !userEmail) setUserEmail(storedEmail)
    
    if (!localStorage.getItem('ms_jwt_token')) {
      openAuthModal()
    }
  }, [userEmail, setUserEmail, openAuthModal])
  const processFile = async (file) => {
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) {
      show(`File too large (${bytesToReadable(file.size)}). Max 30MB.`, 'error'); return
    }

    const name = file.name.toLowerCase()
    
    if (!title.trim()) setTitle(file.name.replace(/\.[^/.]+$/, '').slice(0, 60))

    if (name.endsWith('.txt')) {
      const text = await file.text()
      setTranscriptText(text)
      setUploadInfo(`${file.name} • ${bytesToReadable(file.size)}`)
      show('Transcript loaded.', 'success')
    } else {
      // For PDF, DOCX, etc., use backend Tika extraction
      setLoading(true)
      show(`Extracting text from ${file.name}…`, 'info')
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const res = await api.post('/api/documents/extract', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        if (res.data && res.data.text) {
          setTranscriptText(res.data.text)
          setUploadInfo(`${file.name} • ${bytesToReadable(file.size)}`)
          show('Document parsed successfully!', 'success')
        }
      } catch (err) {
        show(err.response?.data?.error || `Failed to parse document: ${err.message}`, 'error')
      } finally {
        setLoading(false)
      }
    }
    
    // reset input so same file can be chosen again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileUpload = (e) => processFile(e.target.files?.[0])

  const onDrop = (acceptedFiles) => processFile(acceptedFiles[0])
  const { getRootProps, isDragActive } = useDropzone({ 
    onDrop, 
    noClick: true, 
    noKeyboard: true,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    }
  })
  const generateSummary = async () => {
    if (!transcriptText.trim() || !prompt.trim()) {
      show('Transcript and prompt are required.', 'error'); return
    }
    if (new Blob([transcriptText]).size > MAX_UPLOAD_BYTES) {
      show('Transcript too large. Max 30MB.', 'error'); return
    }

    resetSummary()
    setIsStreaming(true)
    setStreamDone(false)
    setFocusMode(true)
    setLoading(true)

    try {
      const payload = { transcriptText, prompt }
      if (title.trim()) payload.title = title.trim()

      const res = await fetch('http://localhost:8080/api/summary/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ms_jwt_token') || ''}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let buffer = ''

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const dataStr = line.substring(5).trim()
              if (!dataStr) continue

              if (dataStr.startsWith('{"___META___":true')) {
                try {
                  const meta = JSON.parse(dataStr)
                  if (meta.summaryId) setSummaryId(meta.summaryId)
                  if (meta.transcriptId) setTranscriptId(meta.transcriptId)
                } catch (_) {}
              } else if (dataStr.startsWith('Error:')) {
                show(dataStr, 'error'); return
              } else {
                try { appendSummary(JSON.parse(dataStr)) }
                catch (_) { appendSummary(dataStr) }
              }
            }
          }
        }
      }
      setStreamDone(true)
      show('Summary generated!', 'success')
    } catch (e) {
      show(`Error: ${e.message}`, 'error')
      setFocusMode(false)
    } finally {
      setIsStreaming(false)
      setLoading(false)
    }
  }
  const saveEdits = useCallback(async (quiet = false) => {
    if (!summaryId) { if (!quiet) show('No summary to save.', 'error'); return }
    if (!quiet) setLoading(true)
    try {
      await api.put(`/api/summary/${summaryId}`, { summaryId, editedSummary: summary })
      if (!quiet) show('Edits saved.', 'success')
    } catch (e) {
      if (!quiet) show(`Error saving: ${e.message}`, 'error')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [summaryId, summary])

  useEffect(() => {
    if (!summaryId || !summary || isStreaming) return
    const h = setTimeout(() => saveEdits(true), 1500)
    return () => clearTimeout(h)
  }, [summary, summaryId, isStreaming])

  const copyToClipboard = () => {
    if (!summary) return
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    show('Copied!', 'success')
  }
  const handleSavePdf = () => {
    if (!summary) return
    const element = document.createElement('div')
    // We add a wrapper to apply basic styling for the PDF
    element.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #111827;">
        <h1 style="font-size: 24px; margin-bottom: 20px;">${title || 'Meeting Summary'}</h1>
        <div style="font-size: 14px; line-height: 1.6;">${summary}</div>
      </div>
    `
    const opt = {
      margin:       10,
      filename:     `${title || 'meeting_summary'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    show('Generating PDF...', 'info')
    html2pdf().set(opt).from(element).save().then(() => {
      show('PDF Downloaded!', 'success')
    }).catch(err => {
      show('Failed to generate PDF', 'error')
    })
  }
  return (
    <div className="h-full flex flex-col bg-surface-50 dark:bg-surface-950 transition-colors duration-200">
      <Topbar />

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex shrink-0 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
        <button
          onClick={() => setMobileTab('input')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-0 cursor-pointer',
            mobileTab === 'input'
              ? 'text-accent-600 dark:text-accent-400 border-b-2 border-accent-600 dark:border-accent-400 bg-accent-50/50 dark:bg-accent-900/10'
              : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 bg-transparent'
          )}
        >
          <PanelLeft size={16} /> Input
        </button>
        <button
          onClick={() => { setMobileTab('output'); if (isStreaming || streamDone) {} }}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-0 cursor-pointer',
            mobileTab === 'output'
              ? 'text-accent-600 dark:text-accent-400 border-b-2 border-accent-600 dark:border-accent-400 bg-accent-50/50 dark:bg-accent-900/10'
              : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 bg-transparent'
          )}
        >
          <PanelRight size={16} /> Output
          {(isStreaming || streamDone) && <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />}
        </button>
      </div>

      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0 overflow-hidden relative">
        {/* ── Left Panel: Input ── */}
        <motion.div
          variants={inputPanelVariants}
          animate={focusMode ? 'compact' : 'full'}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className={cn(
            'flex flex-col gap-3 min-h-0 min-w-0',
            // On mobile: show only when mobileTab === 'input'
            mobileTab === 'input' ? 'flex' : 'hidden',
            // On desktop: always show with flex
            'md:flex'
          )}
        >
          {/* Title */}
          {!focusMode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border p-4 bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-sm"
            >
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
                Meeting Title
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Sprint Review Q3 2025"
                className="w-full bg-transparent text-sm font-medium outline-none text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600"
              />
            </motion.div>
          )}

          {/* Transcript */}
          <div className="flex flex-col rounded-xl border flex-1 min-h-0 bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-surface-400" />
                <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Transcript
                </span>
                {uploadInfo && <span className="text-xs text-surface-400 dark:text-surface-600">— {uploadInfo}</span>}
              </div>
              {!focusMode && (
                <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-700 transition-all">
                  {loading ? (
                    <span className="w-3 h-3 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
                  ) : (
                    <Upload size={12} />
                  )}
                  {loading ? 'Extracting…' : 'Upload'}
                  <input type="file" accept=".txt,.pdf,.docx,.doc" onChange={handleFileUpload} className="sr-only" disabled={loading} />
                </label>
              )}
            </div>

            {focusMode ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center gap-2">
                <FileText size={20} className="text-surface-300 dark:text-surface-600" />
                <p className="text-xs text-surface-400 dark:text-surface-600">{title || 'Transcript loaded'}</p>
                <button
                  onClick={() => { setFocusMode(false); resetSummary() }}
                  className="flex items-center gap-1 text-xs text-accent-500 hover:text-accent-400 mt-1 cursor-pointer bg-transparent border-0"
                >
                  <RotateCcw size={11} /> New Summary
                </button>
              </div>
            ) : (
              <div {...getRootProps()} className="flex-1 flex flex-col relative w-full h-full min-h-[200px]">
                <textarea
                  value={transcriptText}
                  onChange={e => setTranscriptText(e.target.value)}
                  placeholder="Paste your meeting transcript here, or drag & drop a PDF/DOCX/TXT file…"
                  className="flex-1 w-full resize-none px-4 py-3 text-sm bg-transparent outline-none text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 leading-relaxed font-mono"
                />
                {isDragActive && (
                  <div className="absolute inset-0 bg-accent-500/10 backdrop-blur-sm border-2 border-dashed border-accent-500 z-10 flex flex-col items-center justify-center rounded-b-xl">
                    <Upload size={32} className="text-accent-500 mb-2 animate-bounce" />
                    <p className="text-sm font-semibold text-accent-600 dark:text-accent-400">Drop file to extract text</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prompt + Generate */}
          {!focusMode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border p-4 bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowPrompt(p => !p)}
                  className="flex items-center gap-2 text-left cursor-pointer bg-transparent border-0 p-0"
                >
                  <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Template & Prompt</span>
                  <ChevronDown size={13} className={cn('text-surface-400 transition-transform', showPrompt && 'rotate-180')} />
                </button>
              </div>
              {showPrompt && (
                <div className="mt-3 flex flex-col gap-2">
                  <select
                    value={selectedTemplate.id}
                    onChange={e => {
                      const t = TEMPLATES.find(x => x.id === e.target.value)
                      setSelectedTemplate(t)
                      setPrompt(t.prompt)
                    }}
                    className="w-full bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2 text-xs text-surface-700 dark:text-surface-300 outline-none border border-surface-200 dark:border-surface-700 focus:border-accent-400 transition-colors appearance-none cursor-pointer"
                  >
                    {TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <input
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    className="w-full bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2 text-xs text-surface-700 dark:text-surface-300 outline-none border border-surface-200 dark:border-surface-700 focus:border-accent-400 transition-colors"
                  />
                </div>
              )}
              <button
                onClick={generateSummary}
                disabled={loading || isStreaming}
                className={cn(
                  'mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg',
                  'text-sm font-semibold text-white cursor-pointer border-0',
                  'bg-accent-600 hover:bg-accent-500 disabled:opacity-60 disabled:cursor-not-allowed',
                  'transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-accent-500/20'
                )}
              >
                <Wand2 size={15} className={isStreaming ? 'animate-spin' : ''} />
                {isStreaming ? 'Generating…' : 'Generate Summary'}
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* ── Right Panel: Output ── */}
        <motion.div
          variants={outputPanelVariants}
          animate={focusMode ? 'focused' : 'normal'}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className={cn(
            'flex flex-col gap-3 min-h-0 min-w-0',
            mobileTab === 'output' ? 'flex' : 'hidden',
            'md:flex'
          )}
        >
          <div className="flex flex-col flex-1 rounded-xl border min-h-0 overflow-hidden bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800 shrink-0">
              <div className="flex items-center gap-2">
                <Wand2 size={14} className="text-accent-500" />
                <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">AI Summary</span>
                {summaryId && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Saved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {summary && (
                  <>
                    {/* Copy button - icon only on mobile */}
                    <button
                      onClick={copyToClipboard}
                      title={copied ? 'Copied!' : 'Copy'}
                      className="flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-700 transition-all cursor-pointer bg-transparent"
                    >
                      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    {!isStreaming && summaryId && (
                      <>
                        <button
                          onClick={() => saveEdits(false)}
                          disabled={loading}
                          title="Save"
                          className="flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 border border-accent-200 dark:border-accent-800 transition-all cursor-pointer bg-transparent disabled:opacity-50"
                        >
                          <Save size={13} />
                          <span className="hidden sm:inline">Save</span>
                        </button>
                        <button
                          onClick={() => setShowShareModal(true)}
                          title="Share"
                          className="flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium text-white bg-accent-600 hover:bg-accent-500 border-0 transition-all cursor-pointer shadow-sm"
                        >
                          <Send size={13} />
                          <span className="hidden sm:inline">Share</span>
                        </button>
                        <button
                          onClick={handleSavePdf}
                          title="Save PDF"
                          className="flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 border-0 transition-all cursor-pointer shadow-sm"
                        >
                          <Download size={13} />
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                          onClick={() => setShowChat(prev => !prev)}
                          title="Chat"
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium transition-all cursor-pointer shadow-sm border-0",
                            showChat ? "bg-accent-600 hover:bg-accent-500 text-white" : "bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700"
                          )}
                        >
                          <MessageCircle size={13} />
                          <span className="hidden sm:inline">Chat</span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Stream view OR TipTap editor */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <AnimatePresence mode="wait">
                {isStreaming || !streamDone ? (
                  <motion.div key="stream" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                    <StreamingOutput text={summary} isStreaming={isStreaming} />
                  </motion.div>
                ) : (
                  <motion.div key="editor" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="h-full">
                    <TipTapEditor
                      content={summary}
                      onUpdate={(text) => setSummary(text)}
                      placeholder="Your AI summary will appear here…"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showChat && (
            <ChatPanel
              transcript={transcriptText}
              summary={summary}
              onClose={() => setShowChat(false)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        summaryId={summaryId}
        show={show}
      />

      <AuthModal />
      <CommandPalette />
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'info' })} />
    </div>
  )
}
