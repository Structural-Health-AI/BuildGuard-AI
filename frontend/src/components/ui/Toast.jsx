import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastColors = {
  success: 'border-emerald-500/30 text-emerald-400',
  error: 'border-coral-500/30 text-coral-400',
  warning: 'border-amber-500/30 text-amber-400',
  info: 'border-accent-500/30 text-accent-400',
}

function Toast({ toast, onClose }) {
  const Icon = toastIcons[toast.type] || Info

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className={`glass-card rounded-xl px-4 py-3 flex items-start gap-3 border ${toastColors[toast.type]}`}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-gray-200 flex-1">{toast.message}</p>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
