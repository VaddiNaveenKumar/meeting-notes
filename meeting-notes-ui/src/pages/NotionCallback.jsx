import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import api from '../api.js'

export default function NotionCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setStatus('error')
      return
    }

    const exchangeCode = async () => {
      try {
        const response = await api.post('/api/notion/auth', { code })
        // We received the access_token, we can store it in localStorage
        localStorage.setItem('notion_access_token', response.data.access_token)
        setStatus('success')
        
        // Redirect back to home after 2 seconds
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } catch (err) {
        console.error('Notion OAuth error:', err)
        setStatus('error')
        if (err.response?.data?.error) {
          setErrorMessage(err.response.data.error)
        }
      }
    }

    exchangeCode()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="p-8 max-w-sm w-full bg-white dark:bg-surface-900 shadow-xl rounded-2xl border border-surface-200 dark:border-surface-800 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-accent-500 animate-spin mb-4" />
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">Connecting Notion...</h2>
            <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm">Please wait while we securely connect your workspace.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">Connected!</h2>
            <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm">Your Notion workspace is now connected. Redirecting you back...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">Connection Failed</h2>
            <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm">We couldn't connect your Notion workspace. Please try again.</p>
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 text-xs text-left max-h-32 overflow-y-auto break-all">
                {errorMessage}
              </div>
            )}
            <button 
              onClick={() => navigate('/')}
              className="mt-6 px-4 py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 rounded-lg text-sm font-medium transition-colors border-0 cursor-pointer"
            >
              Return Home
            </button>
          </>
        )}
      </div>
    </div>
  )
}
