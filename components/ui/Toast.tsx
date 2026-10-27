'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { ToastItem } from '@/types';

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          let Icon = Info;
          let iconColor = 'text-[var(--lilac-accent)]';
          let borderAccent = 'border-[var(--border-default)]';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            iconColor = 'text-[var(--mint-success)]';
            borderAccent = 'border-[var(--mint-success)]/40';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'text-[var(--primary-coral)]';
            borderAccent = 'border-[var(--primary-coral)]/40';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = 'text-amber-500';
            borderAccent = 'border-amber-500/40';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[var(--bg-card)]/95 backdrop-blur-md border ${borderAccent} shadow-[var(--shadow-float)] text-[var(--text-primary)]`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-sm">
                {toast.title && <p className="font-semibold text-xs tracking-wide uppercase opacity-90">{toast.title}</p>}
                <p className="text-sm leading-relaxed">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => onClose(toast.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
