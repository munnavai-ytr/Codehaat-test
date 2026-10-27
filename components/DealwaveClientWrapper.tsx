'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';
import brandConfig from '@/src/config/brand';

const DealwaveApp = dynamic(
  () => import('@/components/DealwaveApp').then((mod) => mod.DealwaveApp),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] dark:bg-[#0D0B1A] text-[#1E1B4B] dark:text-[#FAF7F2]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E85542] text-white flex items-center justify-center font-bold text-xl shadow-lg">
            {brandConfig.name.slice(0, 1)}
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Spinner size="sm" color="text-[#E85542]" />
            <span>Loading {brandConfig.name}...</span>
          </div>
        </div>
      </div>
    ),
  }
);

export function DealwaveClientWrapper() {
  return <DealwaveApp />;
}
