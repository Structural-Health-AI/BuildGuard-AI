import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="glass-card rounded-2xl p-6 w-full max-w-md relative z-10"
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${danger ? 'bg-coral-500/10' : 'bg-amber-500/10'}`}>
                <AlertTriangle className={`h-5 w-5 ${danger ? 'text-coral-400' : 'text-amber-400'}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400 mt-1">{message}</p>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  danger
                    ? 'bg-coral-500/20 text-coral-400 hover:bg-coral-500/30 border border-coral-500/20 hover:border-coral-500/40'
                    : 'btn-gradient'
                }`}
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
