'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, className = '', containerClassName = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={inputId}
            className={`w-full appearance-none rounded-2xl bg-[var(--bg-card)] border text-base sm:text-sm text-[var(--text-primary)] px-4 py-2.5 pr-10 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--lilac-accent)]/40 ${
              error
                ? 'border-[var(--primary-coral)] focus:ring-[var(--primary-coral)]/30'
                : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
        </div>
        {error ? (
          <p className="text-xs text-[var(--primary-coral)] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-muted)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
