import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl border glass-panel shadow-2xl flex items-start space-x-3 animate-in slide-in-from-right duration-300 ${
              t.type === 'success'
                ? 'border-emerald-500/50 text-emerald-300 glow-emerald'
                : t.type === 'error'
                ? 'border-rose-500/50 text-rose-300'
                : 'border-indigo-500/50 text-indigo-300 glow-indigo'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : t.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 text-xs">
              <h4 className="font-extrabold text-white">{t.title}</h4>
              {t.message && <p className="text-slate-300 mt-0.5">{t.message}</p>}
            </div>

            <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
