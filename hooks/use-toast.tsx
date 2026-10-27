'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ToastItem } from '@/types';
import { ToastContainer } from '@/components/ui/Toast';

interface ToastContextType {
  toasts: ToastItem[];
  toast: (options: { title?: string; message: string; type?: ToastItem['type']; duration?: number }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      message,
      type = 'default',
      duration = 4000,
    }: {
      title?: string;
      message: string;
      type?: ToastItem['type'];
      duration?: number;
    }) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, title, message, type, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: () => {},
      toasts: [],
      removeToast: () => {},
    };
  }
  return context;
}
