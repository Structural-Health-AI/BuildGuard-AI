import axios from 'axios'

const API_BASE = '/api'

export const api = {
  // Dashboard
  getDashboardStats: (sessionId) => {
    const url = sessionId 
      ? `${API_BASE}/dashboard/stats?session_id=${encodeURIComponent(sessionId)}`
      : `${API_BASE}/dashboard/stats`
    return axios.get(url)
  },

  getDashboardTrend: (sessionId) => {
    const url = sessionId
      ? `${API_BASE}/dashboard/trend?session_id=${encodeURIComponent(sessionId)}`
      : `${API_BASE}/dashboard/trend`
    return axios.get(url)
  },

  // Sensor Analysis
  predictSensor: (data, sessionId) => {
    const url = sessionId
      ? `${API_BASE}/sensor/predict?session_id=${encodeURIComponent(sessionId)}`
      : `${API_BASE}/sensor/predict`
    return axios.post(url, data)
  },
  getSensorHistory: (limit = 50, sessionId) => {
    const url = sessionId
      ? `${API_BASE}/sensor/history?limit=${limit}&session_id=${encodeURIComponent(sessionId)}`
      : `${API_BASE}/sensor/history?limit=${limit}`
    return axios.get(url)
  },
  getSensorPrediction: (id) => axios.get(`${API_BASE}/sensor/${id}`),
  deleteSensorPrediction: (id) => axios.delete(`${API_BASE}/sensor/${id}`),

  // Image Analysis
  analyzeImage: (file, sessionId) => {
    const formData = new FormData()
    formData.append('file', file)
    const url = sessionId
      ? `${API_BASE}/image/analyze?session_id=${encodeURIComponent(sessionId)}`
      : `${API_BASE}/image/analyze`
    return axios.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getImageHistory: (limit = 50, sessionId) => {
    const url = sessionId
      ? `${API_BASE}/image/history?limit=${limit}&session_id=${encodeURIComponent(sessionId)}`
      : `${API_BASE}/image/history?limit=${limit}`
    return axios.get(url)
  },
  getImageAnalysis: (id) => axios.get(`${API_BASE}/image/${id}`),
  deleteImageAnalysis: (id) => axios.delete(`${API_BASE}/image/${id}`),

  // Reports
  createReport: (data, sessionId) => {
    const url = sessionId
      ? `${API_BASE}/reports/?session_id=${encodeURIComponent(sessionId)}`
      : `${API_BASE}/reports/`
    return axios.post(url, data)
  },
  getReports: (skip = 0, limit = 50, sessionId) => {
    const url = sessionId
      ? `${API_BASE}/reports/?skip=${skip}&limit=${limit}&session_id=${encodeURIComponent(sessionId)}`
      : `${API_BASE}/reports/?skip=${skip}&limit=${limit}`
    return axios.get(url)
  },
  getReport: (id) => axios.get(`${API_BASE}/reports/${id}`),
  updateReport: (id, data) => axios.put(`${API_BASE}/reports/${id}`, data),
  deleteReport: (id) => axios.delete(`${API_BASE}/reports/${id}`),
}

export default api
