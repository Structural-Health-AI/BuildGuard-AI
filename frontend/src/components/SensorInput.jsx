import { useState } from 'react'
import { Activity, AlertTriangle, CheckCircle, AlertCircle, Loader2, Thermometer, Gauge, Brain, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import { getSessionId } from '../utils/sessionManager'

const T = {
  white: '#FFFFFF', offWhite: '#F8F7F5', charcoal: '#1A1A2E',
  textSecondary: '#6B7280', textMuted: '#9CA3AF',
  border: '#E5E5E5', borderLight: '#F0F0F0',
  terra: '#C2644A', terraHover: '#A84E36',
}

const STATUS = {
  healthy: { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', label: 'Healthy', icon: CheckCircle },
  minor_damage: { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', label: 'Minor Damage', icon: AlertTriangle },
  severe_damage: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'Severe Damage', icon: AlertCircle },
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

function SensorInput() {
  const [formData, setFormData] = useState({
    accel_x: '', accel_y: '', accel_z: '', strain: '', temperature: '',
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
      setError('Please fill in all required sensor fields'); return
    }
    try {
      setLoading(true); setError(null)
      const sessionId = getSessionId()
      const payload = {
        accel_x: parseFloat(formData.accel_x), accel_y: parseFloat(formData.accel_y),
        accel_z: parseFloat(formData.accel_z), strain: parseFloat(formData.strain),
        temperature: parseFloat(formData.temperature),
        building_name: formData.building_name || null, location: formData.location || null
      }
      const response = await api.predictSensor(payload, sessionId)
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze sensor data')
    } finally { setLoading(false) }
  }

  const loadSampleData = (type) => {
    const samples = {
      healthy: { accel_x: '0.15', accel_y: '0.42', accel_z: '9.74', strain: '85', temperature: '24' },
      minor: { accel_x: '0.48', accel_y: '0.19', accel_z: '9.73', strain: '105', temperature: '24' },
      severe: { accel_x: '0.78', accel_y: '0.06', accel_z: '9.73', strain: '170', temperature: '24' }
    }
    if (samples[type]) setFormData(prev => ({ ...prev, ...samples[type] }))
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: T.terra }}>Analysis</p>
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight" style={{ color: T.charcoal }}>Sensor Analysis</h2>
        <p className="mt-1 text-sm" style={{ color: T.textMuted }}>Input structural sensor readings for AI assessment</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <motion.div variants={itemVariants} className="rounded-xl p-6" style={{ background: T.white, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: T.terra }}>Sensor Data</h3>
            <div className="flex gap-2">
              {[
                { type: 'healthy', label: 'Healthy', color: '#059669' },
                { type: 'minor', label: 'Moderate', color: '#D97706' },
                { type: 'severe', label: 'Critical', color: '#DC2626' },
              ].map(s => (
                <button key={s.type} type="button" onClick={() => loadSampleData(s.type)}
                  className="text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full transition-all"
                  style={{ color: s.color, border: `1px solid ${s.color}30` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${s.color}08`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Accelerometer */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: T.textSecondary }}>
                <Activity className="h-3.5 w-3.5" /> Accelerometer (m/s²)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['accel_x', 'accel_y', 'accel_z'].map((field, i) => (
                  <div key={field}>
                    <input type="number" step="0.01" name={field} value={formData[field]} onChange={handleInputChange}
                      placeholder={['X', 'Y', 'Z'][i]} required
                      className="w-full px-3 py-2.5 rounded-lg text-sm font-mono"
                      style={{ background: T.offWhite, border: `1px solid ${T.border}`, color: T.charcoal, outline: 'none' }}
                      onFocus={(e) => (e.target.style.borderColor = T.terra)}
                      onBlur={(e) => (e.target.style.borderColor = T.border)}
                    />
                    <span className="text-[10px] mt-1 block text-center" style={{ color: T.textMuted }}>{['X-axis', 'Y-axis', 'Z-axis (g)'][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strain & Temperature */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: T.textSecondary }}>
                  <Gauge className="h-3.5 w-3.5" /> Strain (με)
                </label>
                <input type="number" step="1" name="strain" value={formData.strain} onChange={handleInputChange}
                  placeholder="e.g., 150" required className="w-full px-3 py-2.5 rounded-lg text-sm font-mono"
                  style={{ background: T.offWhite, border: `1px solid ${T.border}`, color: T.charcoal, outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = T.terra)}
                  onBlur={(e) => (e.target.style.borderColor = T.border)}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: T.textSecondary }}>
                  <Thermometer className="h-3.5 w-3.5" /> Temperature (°C)
                </label>
                <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleInputChange}
                  placeholder="e.g., 25" required className="w-full px-3 py-2.5 rounded-lg text-sm font-mono"
                  style={{ background: T.offWhite, border: `1px solid ${T.border}`, color: T.charcoal, outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = T.terra)}
                  onBlur={(e) => (e.target.style.borderColor = T.border)}
                />
              </div>
            </div>

            {/* Building info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: T.textMuted }}>Building Name</label>
                <input type="text" name="building_name" value={formData.building_name} onChange={handleInputChange}
                  placeholder="e.g., Tower A" className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: T.offWhite, border: `1px solid ${T.border}`, color: T.charcoal, outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = T.terra)}
                  onBlur={(e) => (e.target.style.borderColor = T.border)}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: T.textMuted }}>Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange}
                  placeholder="e.g., Floor 5" className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: T.offWhite, border: `1px solid ${T.border}`, color: T.charcoal, outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = T.terra)}
                  onBlur={(e) => (e.target.style.borderColor = T.border)}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3 rounded-lg text-sm"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50"
              style={{ background: T.terra, color: T.white }}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Brain className="h-4 w-4" /> Run Analysis <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </motion.div>

        {/* Results */}
        <motion.div variants={itemVariants} className="rounded-xl p-6" style={{ background: T.white, border: `1px solid ${T.border}` }}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-6" style={{ color: T.terra }}>Analysis Results</h3>

          {!result ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: T.offWhite }}>
                  <Brain className="h-8 w-8" style={{ color: T.border }} />
                </div>
                <p className="text-sm" style={{ color: T.textSecondary }}>Awaiting sensor data</p>
                <p className="text-xs mt-1" style={{ color: T.textMuted }}>Enter readings and click "Run Analysis"</p>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Status badge */}
              {(() => {
                const config = STATUS[result.damage_level] || STATUS.healthy
                const Icon = config.icon
                return (
                  <div className="p-4 rounded-lg" style={{ background: config.bg, border: `1px solid ${config.border}` }}>
                    <div className="flex items-center gap-3">
                      <Icon className="h-7 w-7" style={{ color: config.text }} />
                      <div>
                        <p className="text-lg font-bold" style={{ color: config.text }}>{config.label}</p>
                        <p className="text-xs" style={{ color: T.textMuted }}>Structural Health Assessment</p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Confidence Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: T.textMuted }}>Confidence</span>
                  <span className="text-sm font-bold font-mono" style={{ color: T.charcoal }}>{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: T.borderLight }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: result.confidence > 0.8 ? '#059669' : result.confidence > 0.6 ? '#D97706' : '#DC2626' }}
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
                  <div key={item.label} className="rounded-lg p-2.5" style={{ background: T.offWhite }}>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: T.textMuted }}>{item.label}</p>
                    <p className="text-sm font-mono font-semibold mt-0.5" style={{ color: T.charcoal }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: T.terra }}>AI Recommendations</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ color: T.textSecondary }}>
                      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                        style={{ background: 'rgba(194,100,74,0.08)', color: T.terra }}>{i + 1}</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timestamp */}
              <div className="pt-4 flex items-center justify-between text-xs font-mono" style={{ borderTop: `1px solid ${T.borderLight}`, color: T.textMuted }}>
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
