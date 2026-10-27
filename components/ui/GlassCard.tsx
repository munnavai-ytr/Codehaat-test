'use client';

import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tiltOnHover?: boolean;
  interactive?: boolean;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function GlassCard({
  children,
  tiltOnHover = false,
  interactive = false,
  className = '',
  padding = 'md',
  ...props
}: GlassCardProps) {
  const paddingClass = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding];

  const tiltClass = tiltOnHover ? 'device-frame-tilt' : '';
  const interactiveClass = interactive
    ? 'transition-all duration-300 hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5 cursor-pointer hover:border-[var(--border-glass-hover)]'
    : '';

  return (
    <div
      className={`rounded-3xl bg-[var(--bg-glass)] backdrop-blur-md border border-[var(--border-glass)] shadow-[var(--shadow-soft)] overflow-hidden text-[var(--text-primary)] ${paddingClass} ${tiltClass} ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
