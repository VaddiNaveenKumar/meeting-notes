import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, X, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store/useStore.js'
import { cn } from '../lib/utils.js'
import api from '../api.js'

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit:    { opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.15 } },
}

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal, setUserEmail } = useStore()
  // Sync local mode whenever the store's authModalMode changes (e.g. Log In vs Sign Up clicked)
  const [mode, setMode] = useState(authModalMode || 'register')
  useEffect(() => { setMode(authModalMode || 'register') }, [authModalMode])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const isLogin = mode === 'login'

  // Clear fields when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setEmail('')
      setPassword('')
      setError('')
      setShowPassword(false)
    }
  }, [isAuthModalOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const res = await api.post(endpoint, { email, password })
      localStorage.setItem('ms_jwt_token', res.data.token)
      localStorage.setItem('ms_user_id', res.data.userId)
      localStorage.setItem('ms_user_email', email)
      setUserEmail(email)
      closeAuthModal()
    } catch (err) {
      const msg = err.response?.data
      setError(typeof msg === 'string' ? msg : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueAsGuest = async () => {
    setGuestLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/anonymous')
      localStorage.setItem('ms_jwt_token', res.data.token)
      localStorage.setItem('ms_user_id', res.data.userId)
      closeAuthModal()
    } catch (err) {
      setError('Could not start a guest session. Please try again.')
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={closeAuthModal}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-full max-w-md px-4'
            )}
          >
            <div className={cn(
              'rounded-2xl border shadow-2xl overflow-hidden',
              'bg-white dark:bg-surface-900',
              'border-surface-200 dark:border-surface-700'
            )}>
              {/* Accent gradient bar */}
              <div className="h-1 w-full bg-gradient-to-r from-accent-400 via-accent-600 to-violet-600" />

              <div className="p-7">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                      {isLogin ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                      {isLogin
                        ? 'Sign in to access your saved summaries.'
                        : 'Save your meeting notes and access them anywhere.'}
                    </p>
                  </div>
                  <button
                    onClick={closeAuthModal}
                    className="p-1.5 rounded-lg cursor-pointer border-0 bg-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Error banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5 uppercase tracking-wider">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className={cn(
                          'w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none',
                          'bg-surface-50 dark:bg-surface-800',
                          'border-surface-200 dark:border-surface-700',
                          'text-surface-900 dark:text-surface-100',
                          'placeholder:text-surface-400 dark:placeholder:text-surface-600',
                          'focus:border-accent-400 dark:focus:border-accent-500',
                          'focus:ring-2 focus:ring-accent-400/20 transition-all'
                        )}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={cn(
                          'w-full pl-9 pr-10 py-2.5 rounded-lg text-sm border outline-none',
                          'bg-surface-50 dark:bg-surface-800',
                          'border-surface-200 dark:border-surface-700',
                          'text-surface-900 dark:text-surface-100',
                          'placeholder:text-surface-400 dark:placeholder:text-surface-600',
                          'focus:border-accent-400 dark:focus:border-accent-500',
                          'focus:ring-2 focus:ring-accent-400/20 transition-all'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 cursor-pointer border-0 bg-transparent p-0"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg mt-1',
                      'text-sm font-semibold text-white cursor-pointer border-0',
                      'bg-accent-600 hover:bg-accent-500',
                      'disabled:opacity-60 disabled:cursor-not-allowed',
                      'transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-accent-500/25'
                    )}
                  >
                    {loading
                      ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</span>
                      : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={15} /></>
                    }
                  </button>
                </form>

                {/* Mode switcher */}
                <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-5">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => { setMode(isLogin ? 'register' : 'login'); setError('') }}
                    className="text-accent-600 dark:text-accent-400 font-semibold hover:underline cursor-pointer border-0 bg-transparent"
                  >
                    {isLogin ? 'Sign up free' : 'Sign in'}
                  </button>
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
                  <span className="text-xs text-surface-400 dark:text-surface-600 font-medium">or</span>
                  <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
                </div>

                {/* Guest access */}
                <button
                  type="button"
                  onClick={handleContinueAsGuest}
                  disabled={guestLoading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg',
                    'text-sm font-medium cursor-pointer border',
                    'text-surface-600 dark:text-surface-300',
                    'bg-surface-50 dark:bg-surface-800',
                    'border-surface-200 dark:border-surface-700',
                    'hover:bg-surface-100 dark:hover:bg-surface-700',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                    'transition-all duration-150'
                  )}
                >
                  {guestLoading
                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-surface-300 border-t-surface-600 rounded-full animate-spin" /> Starting guest session…</span>
                    : '👤 Continue as Guest (no account needed)'
                  }
                </button>
                <p className="text-center text-xs text-surface-400 dark:text-surface-600 mt-2">
                  Guest summaries are temporary and not linked to an account.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
