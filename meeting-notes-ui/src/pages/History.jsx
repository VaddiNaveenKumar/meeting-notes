import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, ExternalLink, FileText, CheckCircle, Edit2, ArrowLeft } from 'lucide-react'
import api from '../api.js'
import Topbar from '../components/Topbar.jsx'
import AuthModal from '../components/AuthModal.jsx'
import CommandPalette from '../components/CommandPalette.jsx'
import { cn } from '../lib/utils.js'

async function fetchHistory(page) {
  const res = await api.get(`/api/history/summaries?page=${page}&size=10`)
  return res.data
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const rowVariants = {
  hidden:   { opacity: 0, y: 16 },
  visible:  { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
}

export default function History() {
  const [page, setPage] = useState(0)
  const [allItems, setAllItems] = useState([])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['history', page],
    queryFn: () => fetchHistory(page),
    // NOTE: onSuccess was removed in TanStack Query v5.
    // Use useEffect to accumulate paginated results instead.
  })

  // Accumulate pages — fires when data changes for a given page
  useEffect(() => {
    if (!data?.content) return
    const newItems = data.content
    setAllItems(prev => {
      const existingIds = new Set(prev.map(i => i.summaryId))
      const fresh = newItems.filter(i => !existingIds.has(i.summaryId))
      return [...prev, ...fresh]
    })
  }, [data])

  const hasMore = data && !data.last

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 transition-colors duration-200">
      <Topbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">History</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              All your AI-generated meeting summaries
            </p>
          </div>
          <Link to="/">
            <motion.button
              whileHover={{ x: -2 }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer',
                'bg-white dark:bg-surface-900',
                'border border-surface-200 dark:border-surface-700',
                'text-surface-600 dark:text-surface-300',
                'hover:border-surface-300 dark:hover:border-surface-600',
                'shadow-sm transition-all duration-150'
              )}
            >
              <ArrowLeft size={14} />
              New Summary
            </motion.button>
          </Link>
        </div>

        {/* Loading skeleton */}
        {isLoading && allItems.length === 0 && (
          <div className={cn(
            'rounded-2xl border overflow-hidden',
            'bg-white dark:bg-surface-900',
            'border-surface-200 dark:border-surface-800',
            'shadow-sm'
          )}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn(
                'flex items-center gap-4 px-6 py-4 border-b last:border-b-0',
                'border-surface-100 dark:border-surface-800'
              )}>
                <div className="w-20 h-4 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" />
                <div className="flex-1 h-4 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" />
                <div className="w-24 h-4 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-2xl border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-8 text-center">
            <p className="text-red-500 dark:text-red-400 text-sm">
              Failed to load history. Make sure you are logged in and the backend is running.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && allItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-2xl border py-20 text-center',
              'bg-white dark:bg-surface-900',
              'border-surface-200 dark:border-surface-800',
              'shadow-sm'
            )}
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-surface-300 dark:text-surface-600" />
            </div>
            <h3 className="text-base font-semibold text-surface-700 dark:text-surface-300">No summaries yet</h3>
            <p className="text-sm text-surface-400 dark:text-surface-600 mt-1">
              Summaries you generate will appear here.
            </p>
            <Link to="/">
              <button className={cn(
                'mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border-0',
                'bg-accent-600 hover:bg-accent-500 text-white',
                'transition-all duration-150 shadow-sm'
              )}>
                Generate your first summary
              </button>
            </Link>
          </motion.div>
        )}

        {/* List */}
        {allItems.length > 0 && (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              'rounded-2xl border overflow-hidden',
              'bg-white dark:bg-surface-900',
              'border-surface-200 dark:border-surface-800',
              'shadow-sm'
            )}
          >
            {/* Table header — desktop only */}
            <div className={cn(
              'hidden md:grid grid-cols-[100px_1fr_160px_100px] items-center',
              'px-6 py-3 border-b text-xs font-semibold uppercase tracking-wider',
              'text-surface-400 dark:text-surface-600',
              'border-surface-100 dark:border-surface-800',
              'bg-surface-50 dark:bg-surface-900/50'
            )}>
              <div>ID</div>
              <div>Title</div>
              <div>Created</div>
              <div>Status</div>
            </div>

            {/* Rows */}
            {allItems.map((row) => (
              <motion.div key={row.summaryId} variants={rowVariants}>
                <Link to={`/summary/${row.summaryId}`} className="no-underline block group">
                  {/* Desktop: grid layout */}
                  <div className={cn(
                    'hidden md:grid grid-cols-[100px_1fr_160px_100px] items-center',
                    'px-6 py-4 border-b last:border-b-0',
                    'border-surface-50 dark:border-surface-800/50',
                    'group-hover:bg-accent-50/50 dark:group-hover:bg-accent-900/10',
                    'transition-all duration-150 cursor-pointer',
                    'border-l-2 border-l-transparent group-hover:border-l-accent-400'
                  )}>
                    <div className="font-mono text-xs text-surface-400 dark:text-surface-600">
                      #{row.summaryId.substring(0, 8).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2 pr-4 min-w-0">
                      <FileText size={14} className="text-surface-300 dark:text-surface-600 shrink-0" />
                      <span className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate group-hover:text-accent-700 dark:group-hover:text-accent-300 transition-colors">
                        {row.title || `Summary ${row.summaryId.substring(0, 8).toUpperCase()}`}
                      </span>
                      <ExternalLink size={12} className="text-surface-300 dark:text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-500">
                      <Clock size={12} className="text-surface-300 dark:text-surface-600" />
                      {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' '}
                      {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      {row.sharedTo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle size={10} /> Sent
                        </span>
                      ) : row.hasEdits ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                          <Edit2 size={10} /> Edited
                        </span>
                      ) : (
                        <span className="text-xs text-surface-300 dark:text-surface-700">—</span>
                      )}
                    </div>
                  </div>

                  {/* Mobile: card layout */}
                  <div className={cn(
                    'flex md:hidden items-start gap-3 px-4 py-4 border-b last:border-b-0',
                    'border-surface-50 dark:border-surface-800/50',
                    'group-hover:bg-accent-50/50 dark:group-hover:bg-accent-900/10',
                    'transition-all duration-150 cursor-pointer',
                    'border-l-2 border-l-transparent group-hover:border-l-accent-400'
                  )}>
                    <FileText size={16} className="text-surface-300 dark:text-surface-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate group-hover:text-accent-700 dark:group-hover:text-accent-300 transition-colors">
                          {row.title || `Summary ${row.summaryId.substring(0, 8).toUpperCase()}`}
                        </span>
                        {row.sharedTo ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle size={9} /> Sent
                          </span>
                        ) : row.hasEdits ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            <Edit2 size={9} /> Edited
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-surface-400 dark:text-surface-600">
                          #{row.summaryId.substring(0, 8).toUpperCase()}
                        </span>
                        <span className="text-surface-300 dark:text-surface-700">·</span>
                        <span className="text-xs text-surface-500 dark:text-surface-500 flex items-center gap-1">
                          <Clock size={10} className="text-surface-300 dark:text-surface-600" />
                          {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <ExternalLink size={13} className="text-surface-300 dark:text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center p-4 border-t border-surface-100 dark:border-surface-800">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoading}
                  className={cn(
                    'px-5 py-2 rounded-xl text-sm font-medium cursor-pointer border',
                    'bg-white dark:bg-surface-900',
                    'border-surface-200 dark:border-surface-700',
                    'text-surface-600 dark:text-surface-300',
                    'hover:bg-surface-50 dark:hover:bg-surface-800',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-150 shadow-sm'
                  )}
                >
                  {isLoading ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </main>

      <AuthModal />
      <CommandPalette />
    </div>
  )
}
