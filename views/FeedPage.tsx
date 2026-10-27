'use client';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FeedView } from '@/components/feed/FeedView';
import { brandConfig } from '@/src/config/brand';

export function FeedPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t('feed.title')} | ${brandConfig.name}`;
  }, [t]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {t('feed.title')}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t('feed.subtitle')}
        </p>
      </div>

      <FeedView initialTab="latest" />
    </div>
  );
}
