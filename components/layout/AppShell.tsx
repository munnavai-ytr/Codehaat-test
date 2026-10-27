'use client';

import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { TopBar } from './TopBar';
import { DesktopNavRail } from './DesktopNavRail';
import { MobileTabBar } from './MobileTabBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] relative overflow-x-hidden">
      {/* Background aurora ambient glow */}
      <div className="aurora-gradient pointer-events-none fixed inset-0 z-0 opacity-70" />

      {/* Top Header */}
      <TopBar />

      <div className="flex-1 flex relative z-10 w-full max-w-[1600px] mx-auto">
        {/* Left Navigation Rail (Desktop) - 1024px+ (lg) */}
        <DesktopNavRail />

        {/* Main Content Area with Enter-Only Motion Transition */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Bottom Tab Bar (Mobile) - Below 1024px (lg:hidden) */}
      <MobileTabBar />
    </div>
  );
}
