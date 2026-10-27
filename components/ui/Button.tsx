'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { Spinner } from './Spinner';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'mint' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  dealPulse?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      dealPulse = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3.5 py-1.5 text-xs rounded-xl font-medium gap-1.5 min-h-[34px]',
      md: 'px-5 py-2.5 text-sm rounded-2xl font-semibold gap-2 min-h-[42px]',
      lg: 'px-6 py-3.5 text-base rounded-2xl font-semibold gap-2.5 min-h-[50px]',
    }[size];

    const variantClasses = {
      primary:
        'bg-[var(--primary-coral)] text-white hover:bg-[var(--primary-coral-hover)] shadow-md shadow-[var(--primary-coral)]/20 active:scale-[0.98]',
      secondary:
        'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)]',
      glass:
        'bg-[var(--bg-glass)] backdrop-blur-md text-[var(--text-primary)] border border-[var(--border-glass)] hover:border-[var(--border-glass-hover)] hover:bg-[var(--bg-card)] shadow-[var(--shadow-soft)]',
      ghost:
        'bg-transparent text-[var(--text-primary)] hover:bg-[var(--lilac-surface)] border border-transparent',
      mint:
        'bg-[var(--mint-success)] text-white hover:opacity-95 shadow-md shadow-[var(--mint-success)]/20',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
    }[variant];

    const pulseClass = dealPulse ? 'deal-pulse ring-2 ring-[var(--mint-success)]/60' : '';

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center transition-all select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${sizeClasses} ${variantClasses} ${pulseClass} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" color={variant === 'secondary' || variant === 'glass' || variant === 'ghost' ? 'text-[var(--text-primary)]' : 'text-white'} />
            <span className="opacity-90">Loading...</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
