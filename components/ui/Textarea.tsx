'use client';

import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', containerClassName = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full rounded-2xl bg-[var(--bg-card)] border text-base sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] p-3.5 min-h-[100px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--lilac-accent)]/40 resize-y ${
            error
              ? 'border-[var(--primary-coral)] focus:ring-[var(--primary-coral)]/30'
              : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[var(--primary-coral)] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-muted)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
