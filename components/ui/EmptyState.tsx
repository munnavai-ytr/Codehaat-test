'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  badge?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  badge,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-3xl bg-[var(--bg-card)]/60 backdrop-blur-sm border border-[var(--border-default)] shadow-[var(--shadow-soft)] max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--lilac-surface)] border border-[var(--lilac-border)] flex items-center justify-center text-[var(--lilac-accent)] mb-5 shadow-sm">
        {icon || <Sparkles className="w-8 h-8" />}
      </div>

      {badge && (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--lilac-surface)] text-[var(--lilac-accent)] mb-3 border border-[var(--lilac-border)]">
          {badge}
        </span>
      )}

      <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-sm mb-6">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
