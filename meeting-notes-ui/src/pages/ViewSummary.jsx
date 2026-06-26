import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, Mail, Cpu } from 'lucide-react'
import api from '../api.js'
import Topbar from '../components/Topbar.jsx'
import AuthModal from '../components/AuthModal.jsx'
import CommandPalette from '../components/CommandPalette.jsx'
import TipTapEditor from '../components/TipTapEditor.jsx'
import { cn } from '../lib/utils.js'

async function fetchSummary(id) {
  const res = await api.get(`/api/history/summary/${id}`)
  return res.data
}

export default function ViewSummary() {
  const { id } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['summary', id],
    queryFn: () => fetchSummary(id),
    enabled: !!id,
  })

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 transition-colors duration-200">
      <Topbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Back navigation */}
        <Link to="/history">
          <motion.button
            whileHover={{ x: -2 }}
            className={cn(
              'flex items-center gap-2 mb-6 text-sm text-surface-500 dark:text-surface-400',
              'hover:text-surface-700 dark:hover:text-surface-200',
              'transition-colors cursor-pointer border-0 bg-transparent p-0'
            )}
          >
            <ArrowLeft size={15} />
            Back to History
          </motion.button>
        </Link>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <div className="h-8 w-64 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
            <div className="h-4 w-48 bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse" />
            <div className={cn(
              'rounded-2xl border p-8 mt-6',
              'bg-white dark:bg-surface-900',
              'border-surface-200 dark:border-surface-800'
            )}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-surface-100 dark:bg-surface-800 rounded animate-pulse mb-3" style={{ width: `${70 + Math.random() * 30}%` }} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-2xl border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-12 text-center">
            <p className="text-red-500 text-sm">Failed to load summary.</p>
            <Link to="/history">
              <button className="mt-4 text-sm text-accent-600 hover:underline cursor-pointer border-0 bg-transparent">
                ← Go back to History
              </button>
            </Link>
          </div>
        )}

        {/* Content */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 leading-tight">
                    {data.title || `Summary #${id?.substring(0, 8).toUpperCase()}`}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-medium',
                      'px-2.5 py-1 rounded-full',
                      'bg-accent-50 dark:bg-accent-900/20',
                      'text-accent-700 dark:text-accent-300'
                    )}>
                      <Cpu size={10} /> AI Generated
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-500">
                      <Calendar size={11} />
                      {new Date(data.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    {data.updatedAt && (
                      <span className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-500">
                        <Clock size={11} />
                        Updated {new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {data.sharedTo && (
                      <span className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-500">
                        <Mail size={11} />
                        Shared to {data.sharedTo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt used */}
            {data.prompt && (
              <div className={cn(
                'mb-4 rounded-xl border px-4 py-3',
                'bg-surface-50 dark:bg-surface-800/50',
                'border-surface-200 dark:border-surface-700'
              )}>
                <div className="text-xs font-semibold text-surface-400 dark:text-surface-600 uppercase tracking-wider mb-1">
                  Prompt Used
                </div>
                <p className="text-xs text-surface-600 dark:text-surface-400 font-mono leading-relaxed">
                  {data.prompt}
                </p>
              </div>
            )}

            {/* Summary content in TipTap (read-only) */}
            <div className={cn(
              'rounded-2xl border overflow-hidden',
              'bg-white dark:bg-surface-900',
              'border-surface-200 dark:border-surface-800',
              'shadow-sm min-h-[400px]'
            )}>
              <TipTapEditor
                content={data.summary || ''}
                readOnly={true}
                placeholder="No content available."
              />
            </div>
          </motion.div>
        )}
      </main>

      <AuthModal />
      <CommandPalette />
    </div>
  )
}
