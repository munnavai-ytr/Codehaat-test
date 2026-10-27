'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Waves,
  Sparkles,
  User,
  LogIn,
  Plus,
  BookmarkCheck,
  Settings,
  Store,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SearchModal } from './SearchModal';
import { SaveAccountModal } from '@/components/auth/SaveAccountModal';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { brandConfig } from '@/src/config/brand';

export function TopBar() {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, isGuest, isAuthenticated, isSeller, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 bg-[var(--bg-card)]/80 backdrop-blur-md border-b border-[var(--border-default)] px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--lilac-accent)] to-[var(--primary-coral)] p-0.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[var(--bg-canvas)] rounded-[14px] flex items-center justify-center text-[var(--primary-coral)]">
                <Waves className="w-5 h-5 text-[var(--primary-coral)] group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-lg md:text-xl tracking-tight text-[var(--text-primary)]">
                  {brandConfig.name}
                </span>
                <span
                  className="deal-pulse w-2 h-2 rounded-full bg-[var(--mint-success)] inline-block"
                  title="Live Marketplace"
                />
              </div>
              <span className="text-[10px] font-medium tracking-wider text-[var(--text-muted)] uppercase hidden sm:block">
                {brandConfig.tagline}
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Trigger */}
        <div className="flex-1 max-w-md mx-1 sm:mx-4">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] hover:border-[var(--text-muted)] text-sm text-[var(--text-muted)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Search className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate text-xs sm:text-sm">Search software, templates, apps...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-muted)]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Actions & Session info */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />

          {/* Sell Button */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate(isSeller ? '/dashboard' : '/settings?tab=seller')}
            className="hidden sm:inline-flex"
          >
            {isSeller ? t('nav.dashboard') : t('nav.sell')}
          </Button>

          {/* Guest / User Badge */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-2xl bg-[var(--bg-card-subtle)] hover:bg-[var(--lilac-surface)] border border-[var(--border-default)] transition-colors cursor-pointer"
              >
                <Avatar
                  src={user.sellerProfile?.avatarUrl || user.photoURL}
                  alt={user.displayName || 'User'}
                  name={user.displayName || 'User'}
                  size="sm"
                  isOnline
                />
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[100px]">
                    {user.displayName}
                  </span>
                  <span className="text-[10px] text-[var(--mint-success)] font-medium capitalize">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-float)] p-1.5 z-50 flex flex-col gap-1 text-xs text-[var(--text-primary)] animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-[var(--border-default)]">
                    <p className="font-bold truncate">{user.displayName}</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                      {user.username ? `@${user.username}` : user.email}
                    </p>
                  </div>

                  {user.username && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate(`/u/${user.username}`);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--bg-card-subtle)] text-left cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[var(--lilac-accent)]" />
                      <span>{t('nav.profile')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate(isSeller ? '/dashboard' : '/settings?tab=seller');
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--bg-card-subtle)] text-left cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5 text-[var(--primary-coral)]" />
                    <span>{isSeller ? t('nav.dashboard') : t('seller.becomeSellerTitle')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--bg-card-subtle)] text-left cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>{t('nav.settings')}</span>
                  </button>

                  <div className="border-t border-[var(--border-default)] my-0.5" />

                  <button
                    type="button"
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-500 text-left cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('nav.signOut')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<BookmarkCheck className="w-3.5 h-3.5 text-[var(--mint-success)]" />}
                onClick={() => setSaveModalOpen(true)}
                className="hidden md:inline-flex text-xs font-semibold text-[var(--mint-success)] hover:bg-[var(--mint-surface)]"
              >
                {t('nav.saveAccount')}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<LogIn className="w-3.5 h-3.5 text-[var(--primary-coral)]" />}
                onClick={() => navigate('/login')}
              >
                {t('nav.signIn')}
              </Button>
            </div>
          )}
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <SaveAccountModal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} />
    </>
  );
}
