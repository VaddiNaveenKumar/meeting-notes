import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '../lib/utils.js'

/**
 * StreamingOutput
 * Shows AI-generated markdown while streaming.
 * Uses ReactMarkdown so headings/bold/lists render properly — no raw `##` symbols.
 * A glow cursor animates at the end while isStreaming=true.
 */
export default function StreamingOutput({ text, isStreaming }) {
  const containerRef = useRef(null)

  // Auto-scroll to bottom as new text arrives
  useEffect(() => {
    if (containerRef.current && isStreaming) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [text, isStreaming])

  // Empty state
  if (!text && !isStreaming) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-surface-400 dark:text-surface-600 py-12">
        <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-400">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <p className="text-sm font-medium mb-1">Your summary will appear here</p>
        <p className="text-xs">Paste a transcript and click Generate to begin</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-5 py-4"
    >
      {/* Render markdown properly during and after streaming */}
      <div className={cn(
        'prose prose-sm max-w-none dark:prose-invert',
        // Tighten prose spacing so it doesn't look gappy
        '[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold',
        '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold',
        '[&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold',
        '[&_p]:my-1.5 [&_p]:leading-relaxed',
        '[&_ul]:my-1.5 [&_ul]:pl-5',
        '[&_ol]:my-1.5 [&_ol]:pl-5',
        '[&_li]:my-0.5',
        '[&_strong]:font-semibold',
        '[&_hr]:my-3',
        // Colors
        'text-surface-800 dark:text-surface-100',
        '[&_h1]:text-surface-900 [&_h1]:dark:text-surface-50',
        '[&_h2]:text-surface-800 [&_h2]:dark:text-surface-100',
        '[&_h3]:text-surface-700 [&_h3]:dark:text-surface-200',
      )}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {text}
        </ReactMarkdown>
      </div>

      {/* Glow cursor — only shown while actively streaming */}
      {isStreaming && (
        <span className="inline-block ml-1 glow-cursor" />
      )}
    </div>
  )
}
