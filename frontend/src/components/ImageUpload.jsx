import { useState, useCallback } from 'react'
import { Upload, Camera, AlertTriangle, CheckCircle, AlertCircle, X, Loader2, Brain, Scan, ArrowRight, ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import { getSessionId } from '../utils/sessionManager'

const T = {
  white: '#FFFFFF', offWhite: '#F8F7F5', charcoal: '#1A1A2E',
  textSecondary: '#6B7280', textMuted: '#9CA3AF',
  border: '#E5E5E5', borderLight: '#F0F0F0',
  terra: '#C2644A', terraHover: '#A84E36',
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

function ImageUpload() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = useCallback((file) => {
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) { setError('Please upload a valid image file (JPEG, PNG, or WebP)'); return }
    if (file.size > 10 * 1024 * 1024) { setError('File size must be less than 10MB'); return }
    setSelectedFile(file); setError(null); setResult(null)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    handleFileSelect(e.dataTransfer.files[0])
  }, [handleFileSelect])

  const analyzeImage = async () => {
    if (!selectedFile) return
    try {
      setLoading(true); setError(null)
      const sessionId = getSessionId()
      const response = await api.analyzeImage(selectedFile, sessionId)
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze image')
    } finally { setLoading(false) }
  }

  const clearSelection = () => {
    setSelectedFile(null); setPreview(null); setResult(null); setError(null)
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: T.terra }}>Detection</p>
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight" style={{ color: T.charcoal }}>Image Analysis</h2>
        <p className="mt-1 text-sm" style={{ color: T.textMuted }}>Upload structural images for AI damage detection</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <motion.div variants={itemVariants} className="rounded-xl p-6" style={{ background: T.white, border: `1px solid ${T.border}` }}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-6" style={{ color: T.terra }}>Upload Image</h3>

          {!selectedFile ? (
            <div
              className="rounded-xl p-10 text-center cursor-pointer relative overflow-hidden transition-all duration-300"
              style={{
                border: `2px dashed ${dragOver ? T.terra : T.border}`,
                background: dragOver ? 'rgba(194,100,74,0.03)' : 'transparent',
              }}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input id="file-input" type="file" className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={(e) => handleFileSelect(e.target.files[0])} />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-5" style={{ background: T.offWhite }}>
                  <Scan className="h-8 w-8" style={{ color: T.terra }} />
                </div>
                <p className="font-medium" style={{ color: T.charcoal }}>Drop image here or browse</p>
                <p className="text-xs mt-2 uppercase tracking-wider" style={{ color: T.textMuted }}>JPEG, PNG, WebP — Max 10MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden" style={{ background: T.offWhite }}>
                <img src={preview} alt="Preview" className="w-full h-64 object-contain" />
                <button onClick={clearSelection}
                  className="absolute top-3 right-3 p-2 rounded-lg transition-all"
                  style={{ background: 'rgba(255,255,255,0.9)', color: T.textMuted, border: `1px solid ${T.border}` }}>
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs truncate max-w-[200px] px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.9)', color: T.textSecondary }}>{selectedFile.name}</span>
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.9)', color: T.textMuted }}>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <button onClick={analyzeImage} disabled={loading}
                className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                style={{ background: T.terra, color: T.white }}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Brain className="h-4 w-4" /> Analyze Image <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 p-3 rounded-lg text-sm"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <motion.div variants={itemVariants} className="rounded-xl p-6" style={{ background: T.white, border: `1px solid ${T.border}` }}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-6" style={{ color: T.terra }}>Detection Results</h3>

          {!result ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: T.offWhite }}>
                  <ImageIcon className="h-8 w-8" style={{ color: T.border }} />
                </div>
                <p className="text-sm" style={{ color: T.textSecondary }}>Awaiting image upload</p>
                <p className="text-xs mt-1" style={{ color: T.textMuted }}>Upload and analyze an image to see results</p>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Status */}
              <div className="p-4 rounded-lg" style={{
                background: result.damage_detected ? '#FEF2F2' : '#ECFDF5',
                border: `1px solid ${result.damage_detected ? '#FECACA' : '#A7F3D0'}`,
              }}>
                <div className="flex items-center gap-3">
                  {result.damage_detected ? (
                    <AlertCircle className="h-7 w-7" style={{ color: '#DC2626' }} />
                  ) : (
                    <CheckCircle className="h-7 w-7" style={{ color: '#059669' }} />
                  )}
                  <div>
                    <p className="text-lg font-bold" style={{ color: result.damage_detected ? '#DC2626' : '#059669' }}>
                      {result.damage_detected ? 'Damage Detected' : 'No Damage Detected'}
                    </p>
                    {result.damage_type && (
                      <p className="text-sm capitalize mt-0.5" style={{ color: T.textSecondary }}>
                        Type: {result.damage_type.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Confidence */}
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

              {/* Recommendations */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: T.terra }}>Recommendations</h4>
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

export default ImageUpload
