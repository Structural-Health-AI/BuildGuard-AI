import axios from 'axios'
import { getUserId } from '../utils/sessionManager'

const API_BASE = '/api'

// Add axios interceptor to include JWT token in all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 errors (unauthorized)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
    return Promise.reject(error)
  }
)

export const api = {
  // Dashboard
  getDashboardStats: (userId) => {
    const resolvedUserId = userId || getUserId()
    return axios.get(`${API_BASE}/dashboard/stats?user_id=${encodeURIComponent(resolvedUserId)}`)
  },

  getDashboardTrend: (userId) => {
    const resolvedUserId = userId || getUserId()
    return axios.get(`${API_BASE}/dashboard/trend?user_id=${encodeURIComponent(resolvedUserId)}`)
  },

  // Sensor Analysis
  predictSensor: (data, userId) => {
    const url = userId
      ? `${API_BASE}/sensor/predict?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/sensor/predict`
    return axios.post(url, data)
  },
  getSensorHistory: (limit = 50, userId) => {
    const url = userId
      ? `${API_BASE}/sensor/history?limit=${limit}&user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/sensor/history?limit=${limit}`
    return axios.get(url)
  },
  getSensorPrediction: (id, userId) => {
    const url = userId
      ? `${API_BASE}/sensor/${id}?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/sensor/${id}`
    return axios.get(url)
  },
  deleteSensorPrediction: (id, userId) => {
    const url = userId
      ? `${API_BASE}/sensor/${id}?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/sensor/${id}`
    return axios.delete(url)
  },

  // Image Analysis
  analyzeImage: (file, userId) => {
    const formData = new FormData()
    formData.append('file', file)
    const url = userId
      ? `${API_BASE}/image/analyze?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/image/analyze`
    return axios.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getImageHistory: (limit = 50, userId) => {
    const url = userId
      ? `${API_BASE}/image/history?limit=${limit}&user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/image/history?limit=${limit}`
    return axios.get(url)
  },
  getImageAnalysis: (id, userId) => {
    const url = userId
      ? `${API_BASE}/image/${id}?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/image/${id}`
    return axios.get(url)
  },
  deleteImageAnalysis: (id, userId) => {
    const url = userId
      ? `${API_BASE}/image/${id}?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/image/${id}`
    return axios.delete(url)
  },

  // Reports
  createReport: (data, userId) => {
    const url = userId
      ? `${API_BASE}/reports/?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/reports/`
    return axios.post(url, data)
  },
  getReports: (skip = 0, limit = 50, userId) => {
    const url = userId
      ? `${API_BASE}/reports/?skip=${skip}&limit=${limit}&user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/reports/?skip=${skip}&limit=${limit}`
    return axios.get(url)
  },
  getReport: (id, userId) => {
    const url = userId
      ? `${API_BASE}/reports/${id}?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/reports/${id}`
    return axios.get(url)
  },
  updateReport: (id, data) => axios.put(`${API_BASE}/reports/${id}`, data),
  deleteReport: (id, userId) => {
    const url = userId
      ? `${API_BASE}/reports/${id}?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/reports/${id}`
    return axios.delete(url)
  },
}

export default api
