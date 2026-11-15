import axios from 'axios'

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '')

const TOKEN_KEY = 'acc_token'
const USER_KEY = 'acc_user'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function safeGet(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

export function getToken() {
  return safeGet(TOKEN_KEY)
}

export function getSavedUser() {
  try { return JSON.parse(safeGet(USER_KEY)) } catch { return null }
}

export function saveSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch { /* storage unavailable: stay logged in for this tab only */ }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch { /* ignore */ }
}

function waitText(seconds) {
  if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} hour(s)`
  if (seconds >= 60) return `${Math.ceil(seconds / 60)} minute(s)`
  return `${seconds} second(s)`
}

// Turns any axios error into a message a user can read
export function errorMessage(error) {
  if (!error.response) return `Cannot reach backend at ${API_URL}. Is the server running?`
  const { status, data, headers } = error.response
  const text = typeof data === 'string' && data ? data : `Request failed (${status})`
  if (status === 429) {
    const seconds = Number(headers['retry-after'])
    return seconds ? `${text} Try again in about ${waitText(seconds)}.` : text
  }
  return text
}
