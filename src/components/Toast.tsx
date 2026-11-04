import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-3 rounded-sm border shadow-2xl backdrop-blur-md flex items-start space-x-3 transition-all font-mono text-xs ${
            toast.type === 'success'
              ? 'bg-[#0D1612]/95 border-[#10B981] text-white shadow-[#10B981]/10'
              : toast.type === 'warning'
              ? 'bg-[#14201A]/95 border-[#F59E0B] text-white shadow-[#F59E0B]/10'
              : 'bg-[#0D1612]/95 border-[#06B6D4] text-white shadow-[#06B6D4]/10'
          }`}
        >
          <div className="mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#06B6D4]" />}
          </div>

          <div className="flex-1">
            <div className="font-semibold text-white tracking-wide">{toast.title}</div>
            {toast.description && (
              <div className="text-[11px] text-white/60 mt-0.5 leading-snug">{toast.description}</div>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
