import { useState, useCallback } from 'react'
import { Upload, Camera, AlertTriangle, CheckCircle, AlertCircle, X, Loader2, Brain, Scan, ArrowRight, ImageIcon } from 'lucide-react'
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
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
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
      const response = await api.analyzeImage(selectedFile)
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
        <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Image Analysis</h2>
        <p className="text-gray-500 mt-1 text-sm">Upload structural images for AI damage detection</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Upload Image</h3>

          {!selectedFile ? (
            <div
              className={`drop-zone rounded-2xl p-10 text-center cursor-pointer relative overflow-hidden transition-all duration-300 ${
                dragOver ? 'border-accent-500/50 bg-accent-500/5 shadow-glow-violet' : ''
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input id="file-input" type="file" className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={(e) => handleFileSelect(e.target.files[0])} />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-5 animate-float">
                  <Scan className="h-8 w-8 text-accent-400" />
                </div>
                <p className="text-gray-300 font-medium">Drop image here or browse</p>
                <p className="text-gray-600 text-xs mt-2 uppercase tracking-wider">JPEG, PNG, WebP — Max 10MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-midnight-900">
                <img src={preview} alt="Preview" className="w-full h-64 object-contain" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-midnight-900/90 to-transparent" />
                <button onClick={clearSelection}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-midnight-900/80 backdrop-blur-sm text-gray-400 hover:text-white hover:bg-midnight-900 transition-all border border-white/5">
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400 truncate max-w-[200px]">{selectedFile.name}</span>
                  <span className="text-xs text-gray-600 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <button onClick={analyzeImage} disabled={loading}
                className="btn-gradient w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold">
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
                className="mt-4 p-3 rounded-xl bg-coral-500/10 border border-coral-500/20 text-coral-400 text-sm">
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Detection Results</h3>

          {!result ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-500/5 flex items-center justify-center mx-auto mb-4 animate-float">
                  <ImageIcon className="h-8 w-8 text-gray-700" />
                </div>
                <p className="text-gray-600 text-sm">Awaiting image upload</p>
                <p className="text-gray-700 text-xs mt-1">Upload and analyze an image to see results</p>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Status */}
              <div className={`p-4 rounded-xl border ${
                result.damage_detected
                  ? 'bg-coral-500/10 border-coral-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  {result.damage_detected ? (
                    <AlertCircle className="h-7 w-7 text-coral-400" />
                  ) : (
                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                  )}
                  <div>
                    <p className={`text-lg font-bold ${result.damage_detected ? 'text-coral-400' : 'text-emerald-400'}`}>
                      {result.damage_detected ? 'Damage Detected' : 'No Damage Detected'}
                    </p>
                    {result.damage_type && (
                      <p className="text-sm text-coral-300/70 capitalize mt-0.5">
                        Type: {result.damage_type.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Confidence */}
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

              {/* Recommendations */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                        i === 0 ? 'bg-coral-500/10 text-coral-400' : 'bg-accent-500/10 text-accent-400'
                      }`}>{i + 1}</span>
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

export default ImageUpload
