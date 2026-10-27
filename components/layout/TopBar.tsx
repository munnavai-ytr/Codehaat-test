'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Waves,
  User,
  Plus,
  BookmarkCheck,
  Settings,
  Store,
  LogOut,
  ChevronDown,
  Globe,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { SearchModal } from './SearchModal';
import { SaveAccountModal } from '@/components/auth/SaveAccountModal';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { brandConfig } from '@/src/config/brand';
import { changeLanguage } from '@/lib/i18n';

export function TopBar() {
  const { t, i18n } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [prefMenuOpen, setPrefMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const prefMenuRef = useRef<HTMLDivElement>(null);

  const { user, isGuest, isAuthenticated, isSeller, logout } = useSession();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const currentLang = i18n.language?.startsWith('bn') ? 'bn' : 'en';

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
      if (prefMenuRef.current && !prefMenuRef.current.contains(e.target as Node)) {
        setPrefMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 bg-[var(--bg-card)]/85 backdrop-blur-md border-b border-[var(--border-default)] px-2.5 sm:px-6 flex items-center justify-between gap-2 overflow-x-hidden">
        {/* Brand identity */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none min-h-[44px] min-w-[44px]"
            aria-label={brandConfig.name}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--lilac-accent)] to-[var(--primary-coral)] p-0.5 shadow-xs group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[var(--bg-canvas)] rounded-[14px] flex items-center justify-center text-[var(--primary-coral)]">
                <Waves className="w-5 h-5 text-[var(--primary-coral)] group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col text-left max-[400px]:hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-base sm:text-xl tracking-tight text-[var(--text-primary)]">
                  {brandConfig.name}
                </span>
                <span
                  className="deal-pulse w-2 h-2 rounded-full bg-[var(--mint-success)] inline-block shrink-0"
                  title="Live Marketplace"
                />
              </div>
              <span className="text-[10px] font-medium tracking-wider text-[var(--text-muted)] uppercase hidden sm:block">
                {brandConfig.tagline}
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Trigger - Input on desktop, compact trigger on phones */}
        <div className="flex-1 max-w-md mx-1 sm:mx-4 min-w-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 min-h-[44px] rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] hover:border-[var(--text-muted)] text-sm text-[var(--text-muted)] transition-colors cursor-pointer"
            aria-label="Search"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate text-xs sm:text-sm">
                {t('explore.searchPlaceholder')}
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-muted)] shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Actions & Session info */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Compact Grouped Preferences Menu (Lang + Theme) for Mobile & Desktop */}
          <div className="relative" ref={prefMenuRef}>
            <button
              type="button"
              onClick={() => setPrefMenuOpen((prev) => !prev)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] px-2.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] hover:border-[var(--text-muted)] text-xs font-semibold text-[var(--text-secondary)] transition-colors cursor-pointer"
              aria-label="Preferences Menu"
            >
              <Globe className="w-4 h-4 text-[var(--lilac-accent)] mr-1" />
              <span className="uppercase">{currentLang}</span>
            </button>

            {prefMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-float)] p-2 z-50 flex flex-col gap-2 text-xs text-[var(--text-primary)] animate-in fade-in duration-150">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1 px-2">
                    {t('settings.languageTitle')}
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        changeLanguage('en');
                        setPrefMenuOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                        currentLang === 'en'
                          ? 'bg-[var(--primary-coral)] text-white'
                          : 'hover:bg-[var(--bg-card-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        changeLanguage('bn');
                        setPrefMenuOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl font-bold transition-colors ${
                        currentLang === 'bn'
                          ? 'bg-[var(--primary-coral)] text-white'
                          : 'hover:bg-[var(--bg-card-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      বাংলা
                    </button>
                  </div>
                </div>

                <div className="border-t border-[var(--border-default)] pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1 px-2">
                    Theme
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTheme('light');
                        setPrefMenuOpen(false);
                      }}
                      className={`p-1.5 rounded-xl flex items-center justify-center ${
                        theme === 'light'
                          ? 'bg-[var(--lilac-surface)] text-[var(--lilac-accent)] font-bold'
                          : 'hover:bg-[var(--bg-card-subtle)] text-[var(--text-muted)]'
                      }`}
                      title="Light"
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTheme('dark');
                        setPrefMenuOpen(false);
                      }}
                      className={`p-1.5 rounded-xl flex items-center justify-center ${
                        theme === 'dark'
                          ? 'bg-[var(--lilac-surface)] text-[var(--lilac-accent)] font-bold'
                          : 'hover:bg-[var(--bg-card-subtle)] text-[var(--text-muted)]'
                      }`}
                      title="Dark"
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTheme('system');
                        setPrefMenuOpen(false);
                      }}
                      className={`p-1.5 rounded-xl flex items-center justify-center ${
                        theme === 'system'
                          ? 'bg-[var(--lilac-surface)] text-[var(--lilac-accent)] font-bold'
                          : 'hover:bg-[var(--bg-card-subtle)] text-[var(--text-muted)]'
                      }`}
                      title="System"
                    >
                      <Laptop className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sell Button - Hidden on phones (< 1024px) */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate(isSeller ? '/dashboard' : '/settings?tab=seller')}
            className="hidden lg:inline-flex min-h-[44px]"
          >
            {isSeller ? t('nav.dashboard') : t('nav.sell')}
          </Button>

          {/* Guest / User Badge */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 min-h-[44px] rounded-2xl bg-[var(--bg-card-subtle)] hover:bg-[var(--lilac-surface)] border border-[var(--border-default)] transition-colors cursor-pointer"
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
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-float)] p-1.5 z-50 flex flex-col gap-1 text-xs text-[var(--text-primary)] animate-in fade-in duration-150">
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
                      className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl hover:bg-[var(--bg-card-subtle)] text-left cursor-pointer"
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
                    className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl hover:bg-[var(--bg-card-subtle)] text-left cursor-pointer"
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
                    className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl hover:bg-[var(--bg-card-subtle)] text-left cursor-pointer"
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
                    className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl hover:bg-rose-500/10 text-rose-500 text-left cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('nav.signOut')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<BookmarkCheck className="w-3.5 h-3.5 text-[var(--mint-success)]" />}
                onClick={() => setSaveModalOpen(true)}
                className="hidden sm:inline-flex text-xs font-semibold text-[var(--mint-success)] hover:bg-[var(--mint-surface)] min-h-[44px]"
              >
                {t('nav.saveAccount')}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/login')}
                className="min-h-[44px] text-xs px-3"
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
