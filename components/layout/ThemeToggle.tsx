'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme mode switcher"
      className={`inline-flex items-center p-1 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-label="Light mode"
        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
          theme === 'light'
            ? 'bg-[var(--bg-card)] text-amber-500 shadow-xs'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
        title="Light theme"
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-label="Dark mode"
        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
          theme === 'dark'
            ? 'bg-[var(--bg-card)] text-[var(--lilac-accent)] shadow-xs'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
        title="Dark theme"
      >
        <Moon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        aria-label="System preference"
        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
          theme === 'system'
            ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
        title={`System theme (${resolvedTheme})`}
      >
        <Laptop className="w-4 h-4" />
      </button>
    </div>
  );
}
