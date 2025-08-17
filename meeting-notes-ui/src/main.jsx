import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './pages/App.jsx'
import History from './pages/History.jsx'
import ViewSummary from './pages/ViewSummary.jsx'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/history', element: <History /> },
  { path: '/summary/:id', element: <ViewSummary /> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
