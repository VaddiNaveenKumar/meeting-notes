import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token from localStorage to every request (if present)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ms_jwt_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => Promise.reject(error))

export default api
