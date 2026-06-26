import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Send, Loader2, FileText } from 'lucide-react'
import { cn } from '../lib/utils'
import api from '../api.js'
import TurndownService from 'turndown'

const turndownService = new TurndownService()

export default function NotionModal({ onClose, summary }) {
  const [pages, setPages] = useState([])
  const [selectedPageId, setSelectedPageId] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const token = localStorage.getItem('notion_access_token')
        const res = await api.post('/api/notion/pages', { token })
        setPages(res.data.pages)
        if (res.data.pages.length > 0) setSelectedPageId(res.data.pages[0].id)
      } catch (err) {
        setError('Failed to fetch Notion pages. ' + (err.response?.data?.error || err.message))
      } finally {
        setLoading(false)
      }
    }
    fetchPages()
  }, [])

  const handleExport = async () => {
    if (!selectedPageId) {
      setError('Please select a target page.')
      return
    }

    setExporting(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('notion_access_token')
      const markdownContent = turndownService.turndown(summary)

      await api.post('/api/notion/export', {
        token,
        pageId: selectedPageId,
        markdownContent
      })

      setSuccess('Successfully exported to Notion!')
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to export to Notion')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-xl overflow-hidden border border-surface-200 dark:border-surface-800 flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 shrink-0">
          <h2 className="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-wide uppercase">
            Export to Notion
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors bg-transparent border-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {error && <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded shrink-0">{error}</div>}
          {success && <div className="text-xs text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded shrink-0">{success}</div>}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-surface-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-accent-500" />
              <p className="text-sm">Loading your Notion pages...</p>
            </div>
          ) : pages.length === 0 && !error ? (
            <div className="text-sm text-surface-500 text-center py-4">
              We couldn't find any pages. Make sure you granted access to pages during the Notion login.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1 uppercase tracking-wider">
                Select Target Page
              </label>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {pages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left cursor-pointer transition-all w-full",
                      selectedPageId === page.id
                        ? "border-accent-500 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 ring-1 ring-accent-500"
                        : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600 text-surface-700 dark:text-surface-300"
                    )}
                  >
                    <FileText size={16} className={selectedPageId === page.id ? "text-accent-500" : "text-surface-400"} />
                    <span className="text-sm font-medium truncate">{page.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 shrink-0">
          <button
            onClick={handleExport}
            disabled={exporting || !selectedPageId || loading}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg',
              'text-sm font-semibold text-white cursor-pointer border-0',
              'bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-150 shadow-sm'
            )}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {exporting ? 'Exporting...' : 'Export to Notion'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
