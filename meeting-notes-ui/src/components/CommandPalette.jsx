import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, History, Moon, Sun, LogIn, LogOut, X } from 'lucide-react'
import { useStore } from '../store/useStore.js'
import { cn } from '../lib/utils.js'

export default function CommandPalette() {
  const navigate = useNavigate()
  const {
    isCommandPaletteOpen, openCommandPalette, closeCommandPalette,
    isDarkMode, toggleDarkMode,
    userEmail, openAuthModal, logout,
    resetSummary, setFocusMode
  } = useStore()

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        isCommandPaletteOpen ? closeCommandPalette() : openCommandPalette()
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        closeCommandPalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isCommandPaletteOpen])

  const run = useCallback((fn) => {
    closeCommandPalette()
    setTimeout(fn, 80) // small delay so the palette closes first
  }, [])

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="cmdoverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeCommandPalette}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          {/* Palette */}
          <motion.div
            key="cmdpalette"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={cn(
              'fixed z-[101] top-[18%] left-1/2 -translate-x-1/2',
              'w-full max-w-[560px] px-4',
            )}
          >
            <Command
              className={cn(
                'rounded-2xl border shadow-2xl overflow-hidden',
                'bg-white dark:bg-surface-900',
                'border-surface-200 dark:border-surface-700',
              )}
              loop
            >
              {/* Search input */}
              <div className={cn(
                'flex items-center gap-3 px-4 py-3.5 border-b',
                'border-surface-100 dark:border-surface-800'
              )}>
                <span className="text-surface-400">⌘</span>
                <Command.Input
                  autoFocus
                  placeholder="Type a command…"
                  className={cn(
                    'flex-1 bg-transparent outline-none text-sm',
                    'text-surface-800 dark:text-surface-100',
                    'placeholder:text-surface-400 dark:placeholder:text-surface-600'
                  )}
                />
                <button
                  onClick={closeCommandPalette}
                  className="p-1 rounded text-surface-400 hover:text-surface-600 cursor-pointer border-0 bg-transparent"
                >
                  <X size={14} />
                </button>
              </div>

              <Command.List className="max-h-72 overflow-y-auto py-2">
                <Command.Empty className="py-8 text-center text-sm text-surface-400 dark:text-surface-600">
                  No commands found.
                </Command.Empty>

                <CommandGroup heading="Navigation">
                  <CommandItem
                    icon={<Wand2 size={15} />}
                    onSelect={() => run(() => {
                      resetSummary()
                      setFocusMode(false)
                      navigate('/')
                    })}
                  >
                    New Summary
                  </CommandItem>
                  <CommandItem
                    icon={<History size={15} />}
                    onSelect={() => run(() => navigate('/history'))}
                  >
                    Go to History
                  </CommandItem>
                </CommandGroup>

                <CommandGroup heading="Appearance">
                  <CommandItem
                    icon={isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                    onSelect={() => run(toggleDarkMode)}
                  >
                    Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
                  </CommandItem>
                </CommandGroup>

                <CommandGroup heading="Account">
                  {userEmail ? (
                    <CommandItem
                      icon={<LogOut size={15} />}
                      onSelect={() => run(logout)}
                      className="text-red-500 dark:text-red-400"
                    >
                      Sign Out ({userEmail})
                    </CommandItem>
                  ) : (
                    <CommandItem
                      icon={<LogIn size={15} />}
                      onSelect={() => run(() => openAuthModal('login'))}
                    >
                      Sign In / Sign Up
                    </CommandItem>
                  )}
                </CommandGroup>
              </Command.List>

              {/* Footer hint */}
              <div className={cn(
                'flex items-center justify-between px-4 py-2.5 border-t',
                'border-surface-100 dark:border-surface-800',
                'bg-surface-50 dark:bg-surface-900/50'
              )}>
                <div className="flex items-center gap-3 text-xs text-surface-400 dark:text-surface-600">
                  <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                  <span><kbd className="font-mono">↵</kbd> select</span>
                  <span><kbd className="font-mono">esc</kbd> close</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function CommandGroup({ heading, children }) {
  return (
    <Command.Group
      heading={heading}
      className={cn(
        'px-2 pt-1 pb-2',
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
        '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold',
        '[&_[cmdk-group-heading]]:text-surface-400 dark:[&_[cmdk-group-heading]]:text-surface-600',
        '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider'
      )}
    >
      {children}
    </Command.Group>
  )
}

function CommandItem({ icon, onSelect, children, className }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg mx-1 cursor-pointer',
        'text-sm text-surface-700 dark:text-surface-300',
        'data-[selected=true]:bg-accent-50 dark:data-[selected=true]:bg-accent-900/30',
        'data-[selected=true]:text-accent-700 dark:data-[selected=true]:text-accent-300',
        'transition-colors duration-100 select-none',
        className
      )}
    >
      <span className="text-surface-400 dark:text-surface-500 group-data-[selected=true]:text-accent-500">
        {icon}
      </span>
      {children}
    </Command.Item>
  )
}
