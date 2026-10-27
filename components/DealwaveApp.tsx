'use client';

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/lib/i18n';
import { ThemeProvider } from '@/hooks/use-theme';
import { SessionProvider } from '@/hooks/use-session';
import { ToastProvider } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';

import { HomePage } from '@/views/HomePage';
import { ExplorePage } from '@/views/ExplorePage';
import { ProductDetailPage } from '@/views/ProductDetailPage';
import { StorefrontPage } from '@/views/StorefrontPage';
import { DealRoomPage } from '@/views/DealRoomPage';
import { MessagesPage } from '@/views/MessagesPage';
import { ConversationPage } from '@/views/ConversationPage';
import { DashboardPage } from '@/views/DashboardPage';
import { BriefsPage } from '@/views/BriefsPage';
import { AdminPage } from '@/views/AdminPage';
import { AdminReviewPage } from '@/views/AdminReviewPage';
import { LoginPage } from '@/views/LoginPage';
import { SettingsPage } from '@/views/SettingsPage';
import { TermsPage } from '@/views/TermsPage';
import { PrivacyPage } from '@/views/PrivacyPage';
import { NotFoundPage } from '@/views/NotFoundPage';
import { RequireUser, RequireSeller, RequireAdmin } from '@/components/auth/RouteGuards';
import { UsernameOnboardingModal } from '@/components/auth/UsernameOnboardingModal';
import { Spinner } from '@/components/ui/Spinner';
import { brandConfig } from '@/src/config/brand';

const emptySubscribe = () => () => {};

export function DealwaveApp() {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) {
    return (
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
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SessionProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppShell>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/p/:productId" element={<ProductDetailPage />} />
                  <Route path="/u/:username" element={<StorefrontPage />} />
                  <Route path="/deal/:productId" element={<DealRoomPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/messages/:conversationId" element={<ConversationPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireSeller>
                        <DashboardPage />
                      </RequireSeller>
                    }
                  />
                  <Route path="/briefs" element={<BriefsPage />} />
                  <Route
                    path="/admin"
                    element={
                      <RequireAdmin>
                        <AdminPage />
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/review"
                    element={
                      <RequireAdmin>
                        <AdminReviewPage />
                      </RequireAdmin>
                    }
                  />
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/settings"
                    element={
                      <RequireUser>
                        <SettingsPage />
                      </RequireUser>
                    }
                  />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                <UsernameOnboardingModal />
              </AppShell>
            </BrowserRouter>
          </ToastProvider>
        </SessionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
