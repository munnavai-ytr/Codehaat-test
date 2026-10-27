'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-3xl bg-[var(--bg-card)] border border-[var(--primary-coral)]/30 shadow-[var(--shadow-soft)] max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--primary-coral-surface)] border border-[var(--primary-coral)]/30 flex items-center justify-center text-[var(--primary-coral)] mb-5 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-sm mb-6">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
