'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  interactive = false,
  ...props
}: CardProps) {
  const paddingClass = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding];

  const interactiveClass = interactive
    ? 'transition-all duration-300 hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5 cursor-pointer hover:border-[var(--border-glass-hover)]'
    : '';

  return (
    <div
      className={`rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-soft)] overflow-hidden text-[var(--text-primary)] ${paddingClass} ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
