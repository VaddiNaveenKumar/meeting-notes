import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, History, Wand2, Command, LogOut, User, ArrowLeft } from 'lucide-react'
import { useStore } from '../store/useStore.js'
import { cn } from '../lib/utils.js'

export default function Topbar() {
  const loc = useLocation()
  const {
    isDarkMode, toggleDarkMode,
    userEmail, openAuthModal, logout,
    openCommandPalette
  } = useStore()

  return (
    <header className={cn(
      'sticky top-0 z-40 h-14 flex items-center justify-between px-3 md:px-5 border-b',
      'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md',
      'border-surface-200 dark:border-surface-800',
      'transition-colors duration-200'
    )}>
      {/* Left side items */}
      <div className="flex items-center gap-3">
        {/* Back to Portfolio Link */}
        <a 
          href="https://vaddinaveenkumar.dev" 
          className="flex items-center gap-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors no-underline"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Portfolio</span>
        </a>

        {/* Logo */}
        <Link to="/" className="no-underline shrink-0">
          <span className="text-base font-bold tracking-tight text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">
            <span className="hidden sm:inline">MeetingNote</span><span className="sm:hidden">MN</span><span className="text-accent-500">AI</span>
          </span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        <NavLink to="/" active={loc.pathname === '/'} icon={<Wand2 size={14} />}>
          <span className="hidden sm:inline">Generate</span>
        </NavLink>
        <NavLink to="/history" active={loc.pathname === '/history'} icon={<History size={14} />}>
          <span className="hidden sm:inline">History</span>
        </NavLink>
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Cmd+K hint - desktop only */}
        <button
          onClick={openCommandPalette}
          className={cn(
            'hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs cursor-pointer bg-transparent border',
            'text-surface-400 dark:text-surface-500',
            'border-surface-200 dark:border-surface-700',
            'hover:border-surface-300 dark:hover:border-surface-600',
            'hover:text-surface-600 dark:hover:text-surface-300',
            'transition-all duration-150'
          )}
        >
          <Command size={11} />
          <span>K</span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className={cn(
            'p-1.5 rounded-md transition-all duration-150 border bg-transparent cursor-pointer',
            'text-surface-500 dark:text-surface-400',
            'border-surface-200 dark:border-surface-700',
            'hover:bg-surface-100 dark:hover:bg-surface-800',
            'hover:text-surface-700 dark:hover:text-surface-200',
          )}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="w-px h-5 bg-surface-200 dark:bg-surface-700" />

        {/* Auth area */}
        {userEmail ? (
          <div className="flex items-center gap-1.5">
            {/* Email chip: hidden on mobile, visible on md+ */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
              <User size={12} className="text-accent-500" />
              <span className="text-xs font-medium text-surface-600 dark:text-surface-300 max-w-[140px] truncate">
                {userEmail}
              </span>
            </div>
            <button
              onClick={logout}
              className={cn(
                'p-1.5 rounded-md transition-all duration-150 border bg-transparent cursor-pointer',
                'text-surface-400 dark:text-surface-500',
                'border-surface-200 dark:border-surface-700',
                'hover:bg-red-50 dark:hover:bg-red-950/30',
                'hover:text-red-500 dark:hover:text-red-400',
                'hover:border-red-200 dark:hover:border-red-800',
              )}
              aria-label="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openAuthModal('login')}
              className={cn(
                'px-2.5 md:px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border bg-transparent',
                'text-surface-600 dark:text-surface-300',
                'border-surface-200 dark:border-surface-700',
                'hover:bg-surface-100 dark:hover:bg-surface-800',
                'transition-all duration-150'
              )}
            >
              Log In
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className={cn(
                'px-2.5 md:px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-0',
                'bg-accent-600 hover:bg-accent-500 text-white',
                'transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-accent-500/25'
              )}
            >
              <span className="hidden sm:inline">Sign Up</span>
              <span className="sm:hidden">Join</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

function NavLink({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium no-underline transition-all duration-150',
        active
          ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300'
          : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200'
      )}
    >
      {icon}
      {children}
    </Link>
  )
}
