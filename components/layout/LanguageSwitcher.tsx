'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { changeLanguage } from '@/lib/i18n';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('bn') ? 'bn' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'bn' : 'en';
    changeLanguage(nextLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label="Toggle language between English and Bengali"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--lilac-surface)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer select-none ${className}`}
      title={currentLang === 'en' ? 'বাংলা ভাষায় দেখুন' : 'Switch to English'}
    >
      <Languages className="w-3.5 h-3.5 text-[var(--lilac-accent)]" />
      <span className="font-sans font-bold">{currentLang === 'en' ? 'বাংলা' : 'EN'}</span>
    </button>
  );
}
