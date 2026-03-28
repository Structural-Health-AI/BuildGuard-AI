import { useState } from 'react'
import { Activity, AlertTriangle, CheckCircle, AlertCircle, Loader2, Thermometer, Gauge, Brain, Hash, ArrowRight } from 'lucide-react'
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

function SensorInput() {
  const [formData, setFormData] = useState({
    accel_x: '', accel_y: '', accel_z: '-9.8',
    strain: '', temperature: '',
    building_name: '', location: ''
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.accel_x || !formData.accel_y || !formData.accel_z || !formData.strain || !formData.temperature) {
      setError('Please fill in all required sensor fields')
      return
    }
    try {
      setLoading(true); setError(null)
      const payload = {
        accel_x: parseFloat(formData.accel_x), accel_y: parseFloat(formData.accel_y),
        accel_z: parseFloat(formData.accel_z), strain: parseFloat(formData.strain),
        temperature: parseFloat(formData.temperature),
        building_name: formData.building_name || null, location: formData.location || null
      }
      const response = await api.predictSensor(payload)
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze sensor data')
    } finally { setLoading(false) }
  }

  const loadSampleData = (type) => {
    const samples = {
      healthy: { accel_x: '0.02', accel_y: '0.01', accel_z: '-9.81', strain: '120', temperature: '24' },
      minor: { accel_x: '0.35', accel_y: '0.28', accel_z: '-9.65', strain: '350', temperature: '28' },
      severe: { accel_x: '0.95', accel_y: '0.88', accel_z: '-9.2', strain: '650', temperature: '38' }
    }
    if (samples[type]) setFormData(prev => ({ ...prev, ...samples[type] }))
  }

  const getDamageConfig = (level) => {
    const configs = {
      healthy: { color: 'emerald', label: 'Healthy', icon: CheckCircle, bgClass: 'bg-emerald-500/10 border-emerald-500/20', textClass: 'text-emerald-400', pillClass: 'status-healthy' },
      minor_damage: { color: 'amber', label: 'Minor Damage', icon: AlertTriangle, bgClass: 'bg-amber-500/10 border-amber-500/20', textClass: 'text-amber-400', pillClass: 'status-warning' },
      severe_damage: { color: 'coral', label: 'Severe Damage', icon: AlertCircle, bgClass: 'bg-coral-500/10 border-coral-500/20', textClass: 'text-coral-400', pillClass: 'status-critical' },
    }
    return configs[level] || configs.healthy
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Sensor Analysis</h2>
        <p className="text-gray-500 mt-1 text-sm">Input structural sensor readings for AI assessment</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
          {/* Sample data buttons */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sensor Data</h3>
            <div className="flex gap-2">
              {[
                { type: 'healthy', label: 'Healthy', cls: 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10' },
                { type: 'minor', label: 'Moderate', cls: 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10' },
                { type: 'severe', label: 'Critical', cls: 'text-coral-400 border-coral-500/20 hover:bg-coral-500/10' },
              ].map(s => (
                <button key={s.type} type="button" onClick={() => loadSampleData(s.type)}
                  className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full border transition-all ${s.cls}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Accelerometer */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                <Activity className="h-3.5 w-3.5" /> Accelerometer (m/s²)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['accel_x', 'accel_y', 'accel_z'].map((field, i) => (
                  <div key={field}>
                    <input type="number" step="0.01" name={field} value={formData[field]} onChange={handleInputChange}
                      placeholder={['X', 'Y', 'Z'][i]} required
                      className="glass-input w-full px-3 py-2.5 rounded-xl text-sm font-mono" />
                    <span className="text-[10px] text-gray-600 mt-1 block text-center">{['X-axis', 'Y-axis', 'Z-axis (g)'][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strain & Temperature */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  <Gauge className="h-3.5 w-3.5" /> Strain (με)
                </label>
                <input type="number" step="1" name="strain" value={formData.strain} onChange={handleInputChange}
                  placeholder="e.g., 150" required className="glass-input w-full px-3 py-2.5 rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  <Thermometer className="h-3.5 w-3.5" /> Temperature (°C)
                </label>
                <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleInputChange}
                  placeholder="e.g., 25" required className="glass-input w-full px-3 py-2.5 rounded-xl text-sm font-mono" />
              </div>
            </div>

            {/* Building info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Building Name</label>
                <input type="text" name="building_name" value={formData.building_name} onChange={handleInputChange}
                  placeholder="e.g., Tower A" className="glass-input w-full px-3 py-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange}
                  placeholder="e.g., Floor 5" className="glass-input w-full px-3 py-2.5 rounded-xl text-sm" />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-coral-500/10 border border-coral-500/20 text-coral-400 text-sm">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading} className="btn-gradient w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Brain className="h-4 w-4" /> Run Analysis <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </motion.div>

        {/* Results */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Analysis Results</h3>

          {!result ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-500/5 flex items-center justify-center mx-auto mb-4 animate-float">
                  <Brain className="h-8 w-8 text-gray-700" />
                </div>
                <p className="text-gray-600 text-sm">Awaiting sensor data</p>
                <p className="text-gray-700 text-xs mt-1">Enter readings and click "Run Analysis"</p>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Status badge */}
              {(() => {
                const config = getDamageConfig(result.damage_level)
                const Icon = config.icon
                return (
                  <div className={`p-4 rounded-xl border ${config.bgClass}`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-7 w-7 ${config.textClass}`} />
                      <div>
                        <p className={`text-lg font-bold ${config.textClass}`}>{config.label}</p>
                        <p className="text-xs text-gray-500">Structural Health Assessment</p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Confidence Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Confidence</span>
                  <span className="text-sm font-bold font-mono text-white">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background: result.confidence > 0.8
                        ? 'linear-gradient(90deg, #34d399, #10b981)'
                        : result.confidence > 0.6
                        ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                        : 'linear-gradient(90deg, #f87171, #ef4444)'
                    }}
                  />
                </div>
              </div>

              {/* Sensor Summary */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Accel X', value: result.input_data.accel_x },
                  { label: 'Accel Y', value: result.input_data.accel_y },
                  { label: 'Accel Z', value: result.input_data.accel_z },
                  { label: 'Strain', value: result.input_data.strain },
                  { label: 'Temp', value: `${result.input_data.temperature}°C` },
                ].map(item => (
                  <div key={item.label} className="bg-midnight-900/60 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-mono font-semibold text-gray-300 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Recommendations</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-500/10 text-accent-400 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timestamp */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-600 font-mono">
                <span>ID: {result.id}</span>
                <span>{new Date(result.timestamp).toLocaleString()}</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default SensorInput
