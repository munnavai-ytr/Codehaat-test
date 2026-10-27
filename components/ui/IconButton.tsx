'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { Spinner } from './Spinner';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  dealPulse?: boolean;
  className?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      dealPulse = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'w-8 h-8 rounded-xl p-1.5 text-xs',
      md: 'w-10 h-10 rounded-2xl p-2.5 text-sm',
      lg: 'w-12 h-12 rounded-2xl p-3 text-base',
    }[size];

    const variantClasses = {
      primary:
        'bg-[var(--primary-coral)] text-white hover:bg-[var(--primary-coral-hover)] shadow-sm',
      secondary:
        'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-card-subtle)]',
      glass:
        'bg-[var(--bg-glass)] backdrop-blur-md text-[var(--text-primary)] border border-[var(--border-glass)] hover:bg-[var(--bg-card)] shadow-[var(--shadow-soft)]',
      ghost:
        'bg-transparent text-[var(--text-primary)] hover:bg-[var(--lilac-surface)] border border-transparent',
      mint:
        'bg-[var(--mint-success)] text-white hover:opacity-90',
    }[variant];

    const pulseClass = dealPulse ? 'deal-pulse' : '';

    return (
      <motion.button
        ref={ref}
        aria-label={ariaLabel}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.94 }}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none ${sizeClasses} ${variantClasses} ${pulseClass} ${className}`}
        {...props}
      >
        {isLoading ? <Spinner size="sm" /> : icon}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
