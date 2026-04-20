import axios from 'axios'

const API_BASE = '/api'

export const api = {
  // Dashboard
  getDashboardStats: (userId) => {
    const url = userId 
      ? `${API_BASE}/dashboard/stats?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/dashboard/stats`
    return axios.get(url)
  },

  getDashboardTrend: (userId) => {
    const url = userId
      ? `${API_BASE}/dashboard/trend?user_id=${encodeURIComponent(userId)}`
      : `${API_BASE}/dashboard/trend`
    return axios.get(url)
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
