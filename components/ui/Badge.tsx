'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'coral' | 'mint' | 'lilac' | 'neutral' | 'outline' | 'glass';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  ...props
}: BadgeProps) {
  const sizeClass = {
    sm: 'px-2 py-0.5 text-[11px] gap-1 rounded-lg',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-xl',
  }[size];

  const variantClass = {
    coral:
      'bg-[var(--primary-coral-surface)] text-[var(--primary-coral)] border border-[var(--primary-coral)]/30 font-semibold',
    mint:
      'bg-[var(--mint-surface)] text-[var(--mint-success)] border border-[var(--mint-success)]/30 font-semibold',
    lilac:
      'bg-[var(--lilac-surface)] text-[var(--lilac-accent)] border border-[var(--lilac-border)] font-semibold',
    neutral:
      'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] font-medium',
    outline:
      'bg-transparent text-[var(--text-secondary)] border border-[var(--border-default)] font-medium',
    glass:
      'bg-[var(--bg-glass)] backdrop-blur-sm text-[var(--text-primary)] border border-[var(--border-glass)] shadow-sm font-medium',
  }[variant];

  return (
    <span
      className={`inline-flex items-center justify-center font-sans tracking-wide select-none ${sizeClass} ${variantClass} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
