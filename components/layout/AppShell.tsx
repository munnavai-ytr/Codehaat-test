'use client';

import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from './TopBar';
import { DesktopNavRail } from './DesktopNavRail';
import { MobileTabBar } from './MobileTabBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] relative overflow-x-hidden">
      {/* Background aurora ambient glow */}
      <div className="aurora-gradient pointer-events-none fixed inset-0 z-0 opacity-70" />

      {/* Top Header */}
      <TopBar />

      <div className="flex-1 flex relative z-10 w-full max-w-[1600px] mx-auto">
        {/* Left Navigation Rail (Desktop) */}
        <DesktopNavRail />

        {/* Main Content Area with Route Transitions */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Tab Bar (Mobile) */}
      <MobileTabBar />
    </div>
  );
}
