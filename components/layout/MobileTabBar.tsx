'use client';

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Compass,
  MessageSquare,
  FileCode,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';

export function MobileTabBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isSeller, isAdmin } = useSession();

  const tabs = [
    { label: t('nav.home') || 'Home', path: '/', icon: Home },
    { label: t('nav.explore') || 'Explore', path: '/explore', icon: Compass },
    {
      label: t('nav.messages') || 'Messages',
      path: '/messages',
      icon: MessageSquare,
      pulse: true,
    },
    { label: t('nav.briefs') || 'Briefs', path: '/briefs', icon: FileCode },
    isAdmin
      ? { label: t('nav.admin') || 'Admin', path: '/admin', icon: ShieldCheck }
      : isSeller
      ? { label: t('nav.dashboard') || 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
      : { label: t('nav.settings') || 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--bg-card)]/90 backdrop-blur-lg border-t border-[var(--border-default)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-1.5"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path.split('?')[0]);

          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer relative group ${
                isActive
                  ? 'text-[var(--primary-coral)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-active:scale-95'}`} />
                {tab.pulse && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--mint-success)] deal-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-[var(--primary-coral)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileTabBar;
