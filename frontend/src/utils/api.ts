import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/auth.store'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Détecter si on est connecté avec un compte de démonstration
const isDemoMode = () => useAuthStore.getState().token === 'demo-token'

// Request interceptor — attach token et bloquer les requêtes en mode démo
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token && token !== 'demo-token') {
      config.headers.Authorization = `Bearer ${token}`
    }
    // En mode démo, annuler la requête HTTP immédiatement
    // Chaque page utilise son fallback .catch(() => setData(demoData()))
    if (token === 'demo-token') {
      const controller = new AbortController()
      controller.abort()
      config.signal = controller.signal
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — gestion globale des erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // En mode démo ou si le backend est indisponible → rejet silencieux
    // Les pages utilisent leurs propres données de démonstration dans .catch()
    if (isDemoMode()) {
      return Promise.reject(error)
    }

    // Erreur réseau pure (pas de réponse du tout)
    if (!error.response) {
      return Promise.reject(error)
    }

    const status = error.response.status

    // 502 / 503 / 504 = backend indisponible via proxy Vite → silencieux
    if (status === 502 || status === 503 || status === 504) {
      return Promise.reject(error)
    }

    // 401 → tentative de refresh token
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken && refreshToken !== 'demo-refresh') {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken })
          const { token, refreshToken: newRefresh } = res.data
          useAuthStore.getState().setTokens(token, newRefresh)
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    // Afficher les toasts uniquement pour les vraies erreurs backend
    const message = error.response?.data?.message || 'Une erreur est survenue'

    if (status === 403) {
      toast.error('Accès refusé — permissions insuffisantes')
    } else if (status === 404) {
      // Géré localement dans chaque page
    } else if (status >= 500) {
      toast.error('Erreur serveur. Veuillez réessayer.')
    } else if (status !== 401) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default api
