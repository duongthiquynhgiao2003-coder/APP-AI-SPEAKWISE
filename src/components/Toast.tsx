import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          id="globalToast"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed top-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100'
              : toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/60 text-rose-100'
              : 'bg-cyan-950/95 border-cyan-500/60 text-cyan-100'
          }`}
        >
          <div id="toastIcon" className="shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
          </div>
          <div id="toastMessage" className="text-xs font-semibold select-none flex-1 leading-relaxed">
            {toast.message}
          </div>
          <button
            id="btnCloseToast"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
