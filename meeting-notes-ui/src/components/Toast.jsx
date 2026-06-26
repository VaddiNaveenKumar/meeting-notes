import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../lib/utils.js'

const icons = {
  success: <CheckCircle2 size={16} className="text-emerald-500" />,
  error:   <AlertCircle  size={16} className="text-red-500" />,
  info:    <Info         size={16} className="text-accent-500" />,
}

const borderColors = {
  success: 'border-emerald-200 dark:border-emerald-800',
  error:   'border-red-200 dark:border-red-800',
  info:    'border-accent-200 dark:border-accent-800',
}

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [message])

  return (
    <div className="fixed bottom-5 right-5 z-[200] pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl',
              'border shadow-xl backdrop-blur-sm',
              'bg-white/95 dark:bg-surface-900/95',
              'text-surface-800 dark:text-surface-100',
              'max-w-sm',
              borderColors[type] || borderColors.info
            )}
          >
            {icons[type] || icons.info}
            <span className="text-sm font-medium flex-1">{message}</span>
            <button
              onClick={onClose}
              className="text-surface-400 hover:text-surface-600 cursor-pointer border-0 bg-transparent p-0.5"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
