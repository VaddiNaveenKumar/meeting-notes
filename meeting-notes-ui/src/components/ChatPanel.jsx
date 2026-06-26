import { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { cn } from '../lib/utils'

export default function ChatPanel({ transcript, summary, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I've read the transcript. What would you like to know about the meeting?" }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsTyping(true)
    
    // Add a placeholder for the AI response
    setMessages(prev => [...prev, { role: 'ai', content: '', isStreaming: true }])

    try {
      const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
      const response = await fetch(`${baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ms_jwt_token')}`
        },
        body: JSON.stringify({
          transcript: transcript,
          summary: summary,
          message: userMsg
        })
      })

      if (!response.ok) throw new Error('Failed to connect to chat stream')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).replace(/\\n/g, '\n')
            setMessages(prev => {
              const newMsgs = [...prev]
              newMsgs[newMsgs.length - 1].content += data
              return newMsgs
            })
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1].content = "Sorry, I encountered an error answering your question."
        return newMsgs
      })
    } finally {
      setMessages(prev => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1].isStreaming = false
        return newMsgs
      })
      setIsTyping(false)
    }
  }

  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        "bg-white dark:bg-surface-900 flex flex-col z-20",
        // Mobile: full-screen overlay, slide from right
        "fixed inset-0",
        // Desktop: side panel
        "md:absolute md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-80",
        "md:border-l border-surface-200 dark:border-surface-800",
        "md:shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)]"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800 shrink-0">
        <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100 flex items-center gap-2">
          <Bot size={16} className="text-accent-500" />
          Chat with Meeting
        </h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 cursor-pointer border-0 bg-transparent">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1",
              msg.role === 'user' ? "bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400" : "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400"
            )}>
              {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className={cn(
              "px-3 py-2 rounded-2xl max-w-[80%] text-sm",
              msg.role === 'user' ? "bg-accent-600 text-white rounded-tr-sm" : "bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-surface-200 rounded-tl-sm"
            )}>
              {msg.role === 'ai' ? (
                <div 
                  className="prose prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0 dark:prose-invert max-w-none text-sm break-words"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(msg.content)) }}
                />
              ) : (
                msg.content
              )}
              {msg.isStreaming && <span className="inline-block w-1.5 h-3 bg-accent-500 animate-pulse ml-1 align-middle" />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-surface-100 dark:border-surface-800 shrink-0">
        <form 
          onSubmit={e => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 rounded-full p-1 pl-4 border border-surface-200 dark:border-surface-700 focus-within:border-accent-400 transition-colors"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-transparent text-sm outline-none text-surface-800 dark:text-surface-100 placeholder:text-surface-400"
            disabled={isTyping}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-full bg-accent-600 hover:bg-accent-500 text-white disabled:opacity-50 transition-colors border-0 cursor-pointer"
          >
            {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
