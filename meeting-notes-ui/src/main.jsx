import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './pages/App.jsx'
import History from './pages/History.jsx'
import ViewSummary from './pages/ViewSummary.jsx'
import './index.css'
import { useStore } from './store/useStore.js'

// Apply persisted dark mode before first render
const savedState = JSON.parse(localStorage.getItem('ms-app-store') || '{}')
if (savedState?.state?.isDarkMode) {
  document.documentElement.classList.add('dark')
}

// Pre-fill user email from localStorage for backwards compatibility
if (!savedState?.state?.userEmail) {
  const storedEmail = localStorage.getItem('ms_user_email')
  if (storedEmail) {
    // Will be hydrated by Zustand persist, but also warm up the field
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: 1,
    },
  },
})

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/history', element: <History /> },
  { path: '/summary/:id', element: <ViewSummary /> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
