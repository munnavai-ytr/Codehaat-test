'use client';

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Compass,
  MessageSquare,
  FileCode,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Store,
  BookmarkCheck,
  ChevronRight,
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SaveAccountModal } from '@/components/auth/SaveAccountModal';

export function DesktopNavRail() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest, isAuthenticated, isSeller, isAdmin } = useSession();
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const navItems = [
    { label: t('nav.home'), path: '/', icon: Home },
    { label: t('nav.explore'), path: '/explore', icon: Compass },
    {
      label: t('nav.messages'),
      path: '/messages',
      icon: MessageSquare,
      pulse: true,
    },
    { label: t('nav.briefs'), path: '/briefs', icon: FileCode },
    {
      label: isSeller ? t('nav.dashboard') : t('seller.becomeSellerTitle'),
      path: isSeller ? '/dashboard' : '/settings?tab=seller',
      icon: isSeller ? LayoutDashboard : Store,
    },
    ...(isAdmin
      ? [{ label: t('nav.admin'), path: '/admin', icon: ShieldCheck, adminOnly: true }]
      : []),
    { label: t('nav.settings'), path: '/settings', icon: Settings },
  ];

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 min-h-[calc(100dvh-4rem)] bg-[var(--bg-card)]/50 backdrop-blur-sm border-r border-[var(--border-default)] p-4 justify-between">
        {/* Navigation Links */}
        <div className="flex flex-col gap-1.5">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Navigation
          </div>

          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path.split('?')[0]);

            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer group select-none ${
                  isActive
                    ? 'bg-[var(--lilac-surface)] text-[var(--text-primary)] border border-[var(--lilac-border)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-[var(--primary-coral)] text-white'
                        : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.pulse && (
                  <span className="w-2 h-2 rounded-full bg-[var(--mint-success)] deal-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Area with Identity & Save Account */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-default)]">
          {/* Guest Save Account Banner */}
          {isGuest && (
            <div className="p-3 rounded-2xl bg-[var(--mint-surface)] border border-[var(--mint-success)]/30 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--mint-success)]">
                <BookmarkCheck className="w-4 h-4" />
                <span>Temporary Identity</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Save with Google or Email to keep your chats and software.
              </p>
              <Button
                variant="mint"
                size="sm"
                onClick={() => setSaveModalOpen(true)}
                className="w-full text-xs"
              >
                {t('nav.saveAccount')}
              </Button>
            </div>
          )}

          {/* User Card */}
          <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={user?.sellerProfile?.avatarUrl || user?.photoURL}
                alt={user?.displayName || 'User'}
                name={user?.displayName || 'Guest User'}
                size="sm"
                isOnline
                pulseOnline={isGuest}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {user?.displayName || 'Guest Explorer'}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] truncate">
                  {isGuest
                    ? `ID: ${user?.uid.slice(-6).toUpperCase()}`
                    : user?.username
                    ? `@${user.username}`
                    : user?.email}
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[var(--border-default)] flex items-center justify-between text-[11px]">
              <Badge variant={isGuest ? 'neutral' : 'mint'} size="sm">
                {isGuest ? 'Guest' : user?.role || 'Member'}
              </Badge>
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated) {
                    if (user?.username) navigate(`/u/${user.username}`);
                    else navigate('/settings');
                  } else {
                    navigate('/login');
                  }
                }}
                className="text-[var(--primary-coral)] hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>{isAuthenticated ? 'Profile' : 'Sign in'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Legal & Version */}
          <div className="flex items-center justify-between px-2 text-[11px] text-[var(--text-muted)]">
            <button
              type="button"
              onClick={() => navigate('/terms')}
              className="hover:text-[var(--text-primary)] hover:underline"
            >
              Terms
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate('/privacy')}
              className="hover:text-[var(--text-primary)] hover:underline"
            >
              Privacy
            </button>
            <span>•</span>
            <span className="font-mono text-[10px]">V1.0</span>
          </div>
        </div>
      </aside>

      <SaveAccountModal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} />
    </>
  );
}
