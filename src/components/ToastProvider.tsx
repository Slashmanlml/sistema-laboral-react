/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: Toast = { ...toast, id };
    setToasts(prev => [newToast, ...prev].slice(0, 5));
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) =>
    showToast({ type: 'success', title, message }), [showToast]);
  const error = useCallback((title: string, message?: string) =>
    showToast({ type: 'error', title, message, duration: 6000 }), [showToast]);
  const warning = useCallback((title: string, message?: string) =>
    showToast({ type: 'warning', title, message, duration: 5000 }), [showToast]);
  const info = useCallback((title: string, message?: string) =>
    showToast({ type: 'info', title, message }), [showToast]);

  const icons = {
    success: <CheckCircle size={18} />,
    error:   <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info:    <Info size={18} />,
  };

  const styles = {
    success: {
      wrapper: 'bg-white border-l-4 border-emerald-500',
      icon: 'text-emerald-500',
      title: 'text-emerald-900',
    },
    error: {
      wrapper: 'bg-white border-l-4 border-red-500',
      icon: 'text-red-500',
      title: 'text-red-900',
    },
    warning: {
      wrapper: 'bg-white border-l-4 border-amber-500',
      icon: 'text-amber-500',
      title: 'text-amber-900',
    },
    info: {
      wrapper: 'bg-white border-l-4 border-blue-500',
      icon: 'text-blue-500',
      title: 'text-blue-900',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div
        aria-live="polite"
        aria-label="Notificaciones"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
        style={{ maxWidth: '360px', width: '100%' }}
      >
        {toasts.map(toast => {
          const s = styles[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl animate-slide-up ${s.wrapper}`}
              style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 4px 10px -5px rgba(0,0,0,0.08)' }}
            >
              <span className={`shrink-0 mt-0.5 ${s.icon}`}>{icons[toast.type]}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-snug ${s.title}`}>{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition p-0.5 rounded-lg hover:bg-slate-100"
                aria-label="Cerrar notificación"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
};
