import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' }
})

const user = import.meta.env.VITE_BASIC_USER || 'admin'
const pass = import.meta.env.VITE_BASIC_PASS || 'changeme'
const token = btoa(`${user}:${pass}`)
api.defaults.headers.common['Authorization'] = `Basic ${token}`

// TEMP: identify current user (could be email or a local nickname)
const userId = localStorage.getItem('ms_user_id') || 'user-local'
api.defaults.headers.common['X-User-Id'] = userId

export default api
