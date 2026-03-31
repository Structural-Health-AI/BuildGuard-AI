import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

const T = {
  white: '#FFFFFF', charcoal: '#1A1A2E',
  textSecondary: '#6B7280', textMuted: '#9CA3AF',
  border: '#E5E5E5', terra: '#C2644A',
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', danger = true }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <div className="absolute inset-0" style={{ background: 'rgba(26, 26, 46, 0.25)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="rounded-xl p-6 w-full max-w-md relative z-10"
            style={{ background: T.white, border: `1px solid ${T.border}`, boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg" style={{
                background: danger ? '#FEF2F2' : '#FFFBEB',
              }}>
                <AlertTriangle className="h-5 w-5" style={{
                  color: danger ? '#DC2626' : '#D97706',
                }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold" style={{ color: T.charcoal }}>{title}</h3>
                <p className="text-sm mt-1" style={{ color: T.textSecondary }}>{message}</p>
              </div>
              <button onClick={onClose} className="transition-colors" style={{ color: T.textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.charcoal)}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ color: T.textSecondary, border: `1px solid ${T.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.charcoal; e.currentTarget.style.color = T.charcoal }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: danger ? '#DC2626' : T.terra,
                  color: T.white,
                }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
