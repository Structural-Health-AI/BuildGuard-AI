import { useState, useEffect } from 'react'
import { FileText, CheckCircle, Loader2, Building, MapPin, User, Activity, Thermometer, Gauge, ArrowRight, Brain, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

function ReportForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    building_name: '', location: '', inspector_name: '', description: '', sensor_prediction_id: ''
  })
  const [sensorData, setSensorData] = useState({
    accel_x: '', accel_y: '', accel_z: '', strain: '', temperature: ''
  })
  const [sensorMode, setSensorMode] = useState('new')
  const [sensorHistory, setSensorHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingHistory, setFetchingHistory] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    try {
      setFetchingHistory(true)
      const sensorRes = await api.getSensorHistory(20)
      setSensorHistory(sensorRes.data)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally { setFetchingHistory(false) }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSensorChange = (e) => {
    const { name, value } = e.target
    setSensorData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.building_name || !formData.location || !formData.inspector_name) {
      setError('Please fill in all required fields'); return
    }
    try {
      setLoading(true); setError(null)
      let sensorPredictionId = null
      if (sensorMode === 'new') {
        const { accel_x, accel_y, accel_z, strain, temperature } = sensorData
        if (!accel_x || !accel_y || !accel_z || !strain || !temperature) {
          setError('Please fill in all sensor data fields'); setLoading(false); return
        }
        const sensorPayload = {
          accel_x: parseFloat(accel_x), accel_y: parseFloat(accel_y), accel_z: parseFloat(accel_z),
          strain: parseFloat(strain), temperature: parseFloat(temperature),
          building_name: formData.building_name, location: formData.location
        }
        const sensorResponse = await api.predictSensor(sensorPayload)
        sensorPredictionId = sensorResponse.data.id
      } else if (formData.sensor_prediction_id) {
        sensorPredictionId = parseInt(formData.sensor_prediction_id)
      }
      await api.createReport({
        building_name: formData.building_name, location: formData.location,
        inspector_name: formData.inspector_name, description: formData.description || null,
        sensor_prediction_id: sensorPredictionId, image_analysis_id: null
      })
      setSuccess(true)
      setTimeout(() => navigate('/reports'), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create report')
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-2xl p-10 text-center max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
            className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Report Created!</h2>
          <p className="text-gray-500 text-sm">Your structural health report has been saved successfully.</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">
            <Loader2 className="h-3 w-3 animate-spin" /> Redirecting to reports...
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Create New Report</h2>
        <p className="text-gray-500 mt-1 text-sm">Document a structural health inspection</p>
      </motion.div>

      <motion.div variants={itemVariants} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                  <Building className="h-3.5 w-3.5" /> Building Name *
                </label>
                <input type="text" name="building_name" value={formData.building_name} onChange={handleInputChange}
                  placeholder="e.g., Central Tower, Bridge A" required className="glass-input w-full px-3 py-2.5 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                    <MapPin className="h-3.5 w-3.5" /> Location *
                  </label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange}
                    placeholder="e.g., Downtown Area" required className="glass-input w-full px-3 py-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                    <User className="h-3.5 w-3.5" /> Inspector *
                  </label>
                  <input type="text" name="inspector_name" value={formData.inspector_name} onChange={handleInputChange}
                    placeholder="Your name" required className="glass-input w-full px-3 py-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Description (optional)</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange}
                  placeholder="Additional notes about the inspection..." rows={3}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-sm resize-none" />
              </div>
            </div>
          </div>

          {/* Sensor Data */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Sensor Data</h3>
            <div className="flex gap-2 mb-4">
              {[
                { mode: 'new', label: 'Enter New Data', icon: Sparkles },
                { mode: 'existing', label: 'Link Existing', icon: Activity },
              ].map(opt => (
                <button key={opt.mode} type="button" onClick={() => setSensorMode(opt.mode)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    sensorMode === opt.mode
                      ? 'btn-gradient'
                      : 'bg-white/5 text-gray-400 hover:bg-white/8 border border-white/5'
                  }`}>
                  <opt.icon className="h-4 w-4" /> {opt.label}
                </button>
              ))}
            </div>

            {sensorMode === 'new' ? (
              <div className="space-y-4 p-4 rounded-xl bg-midnight-900/50 border border-white/5">
                <p className="text-xs text-gray-600">Enter sensor readings for AI analysis</p>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                    <Activity className="h-3.5 w-3.5" /> Accelerometer (m/s²)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['accel_x', 'accel_y', 'accel_z'].map((field, i) => (
                      <div key={field}>
                        <input type="number" step="0.01" name={field} value={sensorData[field]} onChange={handleSensorChange}
                          placeholder={['X', 'Y', 'Z'][i]} className="glass-input w-full px-3 py-2.5 rounded-xl text-sm font-mono" />
                        <span className="text-[10px] text-gray-600 mt-1 block text-center">{['X-axis', 'Y-axis', 'Z-axis'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                      <Gauge className="h-3.5 w-3.5" /> Strain (με)
                    </label>
                    <input type="number" step="0.1" name="strain" value={sensorData.strain} onChange={handleSensorChange}
                      placeholder="e.g., 100" className="glass-input w-full px-3 py-2.5 rounded-xl text-sm font-mono" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                      <Thermometer className="h-3.5 w-3.5" /> Temperature (°C)
                    </label>
                    <input type="number" step="0.1" name="temperature" value={sensorData.temperature} onChange={handleSensorChange}
                      placeholder="e.g., 25" className="glass-input w-full px-3 py-2.5 rounded-xl text-sm font-mono" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-midnight-900/50 border border-white/5">
                <p className="text-xs text-gray-600 mb-3">Link a previous sensor analysis to this report</p>
                <select name="sensor_prediction_id" value={formData.sensor_prediction_id} onChange={handleInputChange}
                  disabled={fetchingHistory}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-sm">
                  <option value="">None selected</option>
                  {sensorHistory.map(item => (
                    <option key={item.id} value={item.id}>
                      #{item.id} — {item.damage_level} ({new Date(item.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-coral-500/10 border border-coral-500/20 text-coral-400 text-sm">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="btn-gradient flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating Report...</>
              ) : (
                <><FileText className="h-4 w-4" /> Create Report <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
            <button type="button" onClick={() => navigate('/reports')}
              className="px-6 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default ReportForm
