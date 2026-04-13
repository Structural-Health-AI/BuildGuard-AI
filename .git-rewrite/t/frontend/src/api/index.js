import axios from 'axios'

const API_BASE = '/api'

export const api = {
  // Dashboard
  getDashboardStats: () => axios.get(`${API_BASE}/dashboard/stats`),

  // Sensor Analysis
  predictSensor: (data) => axios.post(`${API_BASE}/sensor/predict`, data),
  getSensorHistory: (limit = 50) => axios.get(`${API_BASE}/sensor/history?limit=${limit}`),
  getSensorPrediction: (id) => axios.get(`${API_BASE}/sensor/${id}`),
  deleteSensorPrediction: (id) => axios.delete(`${API_BASE}/sensor/${id}`),

  // Image Analysis
  analyzeImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`${API_BASE}/image/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getImageHistory: (limit = 50) => axios.get(`${API_BASE}/image/history?limit=${limit}`),
  getImageAnalysis: (id) => axios.get(`${API_BASE}/image/${id}`),
  deleteImageAnalysis: (id) => axios.delete(`${API_BASE}/image/${id}`),

  // Reports
  createReport: (data) => axios.post(`${API_BASE}/reports/`, data),
  getReports: (skip = 0, limit = 50) => axios.get(`${API_BASE}/reports/?skip=${skip}&limit=${limit}`),
  getReport: (id) => axios.get(`${API_BASE}/reports/${id}`),
  updateReport: (id, data) => axios.put(`${API_BASE}/reports/${id}`, data),
  deleteReport: (id) => axios.delete(`${API_BASE}/reports/${id}`),
}

export default api
