'use client';

import React, { useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  sendPasswordResetEmail,
  sendEmailVerification,
  type AuthError,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { brandConfig } from '@/src/config/brand';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export function LoginPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const returnUrl = searchParams.get('returnUrl') || (location.state as { from?: string })?.from || '/';

  const {
    user,
    status,
    isGuest,
    isAuthenticated,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  } = useSession();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  const mapAuthError = (err: unknown): string => {
    const error = err as AuthError;
    switch (error.code) {
      case 'auth/user-not-found':
        return t('errors.userNotFound');
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return t('errors.wrongPassword');
      case 'auth/email-already-in-use':
        return t('errors.emailInUse');
      case 'auth/weak-password':
        return t('errors.weakPassword');
      case 'auth/invalid-email':
        return t('errors.invalidEmail');
      case 'auth/network-request-failed':
        return t('errors.networkError');
      default:
        return error.message || 'Authentication error occurred.';
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      toast({
        title: 'Welcome to ' + brandConfig.name,
        message: 'Successfully signed in with Google.',
        type: 'success',
      });
      navigate(returnUrl);
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg(t('errors.required'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTab === 'signin') {
        await loginWithEmail(email, password);
        toast({
          title: 'Welcome back!',
          message: 'Signed in successfully.',
          type: 'success',
        });
        navigate(returnUrl);
      } else if (activeTab === 'signup') {
        if (password.length < 6) {
          setErrorMsg(t('errors.passwordTooShort'));
          setIsSubmitting(false);
          return;
        }
        await registerWithEmail(email, password, displayName);
        toast({
          title: 'Account Created!',
          message: 'Please check your email to verify your address.',
          type: 'success',
        });
        navigate(returnUrl);
      }
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg(t('errors.required'));
      return;
    }
    if (!auth) {
      setErrorMsg('Auth is not configured.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      toast({
        title: 'Reset Email Sent',
        message: 'Check your inbox for password reset instructions.',
        type: 'info',
      });
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth?.currentUser) return;
    setResendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: t('auth.verificationSent'),
        message: 'A fresh verification link has been delivered to your email.',
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Notice',
        message: err instanceof Error ? err.message : 'Could not resend email.',
        type: 'error',
      });
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 pb-16 flex flex-col gap-6">
      {/* Brand Header */}
      <div className="text-center flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-[var(--primary-coral-surface)] text-[var(--primary-coral)] flex items-center justify-center mb-1">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {isAuthenticated ? 'Your Account' : `Welcome to ${brandConfig.name}`}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
          {brandConfig.tagline} • Connect, sell, and deal on real software.
        </p>
      </div>

      {/* Unverified Email Banner */}
      {isAuthenticated && user && !user.emailVerified && user.email && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-600 dark:text-amber-400">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t('auth.verificationBannerTitle')}</p>
              <p className="opacity-90 mt-0.5">{t('auth.verificationBannerDesc')}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            isLoading={resendingVerification}
            onClick={handleResendVerification}
            className="shrink-0"
          >
            {t('auth.resendVerification')}
          </Button>
        </div>
      )}

      <Card padding="lg" className="flex flex-col gap-6">
        {/* Guest Session Note */}
        {isGuest && (
          <div className="p-4 rounded-2xl bg-[var(--mint-surface)] border border-[var(--mint-success)]/30 text-xs">
            <div className="flex items-center gap-2 text-[var(--mint-success)] font-bold uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>{t('guest.bannerTitle')} ({user?.displayName || 'Guest'})</span>
            </div>
            <p className="text-[var(--text-secondary)] mt-1 leading-relaxed">
              {t('guest.bannerDesc')}
            </p>
          </div>
        )}

        {isAuthenticated && user ? (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] w-full text-left">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Signed in as</p>
              <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">{user.displayName}</p>
              <p className="text-xs text-[var(--text-muted)] font-mono">{user.email || 'No email'}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={user.emailVerified ? 'mint' : 'neutral'} size="sm">
                  {user.emailVerified ? 'Verified Email' : 'Unverified Email'}
                </Badge>
                <Badge variant="coral" size="sm" className="capitalize">{user.role}</Badge>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => navigate(user.role === 'seller' ? '/dashboard' : '/settings')}
              >
                {user.role === 'seller' ? 'Go to Dashboard' : 'Account Settings'}
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await logout();
                  toast({ message: 'Signed out to anonymous guest mode.', type: 'info' });
                }}
              >
                {t('nav.signOut')}
              </Button>
            </div>
          </div>
        ) : activeTab === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                {t('auth.resetPasswordTitle')}
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{t('auth.resetPasswordDesc')}</p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[var(--primary-coral-surface)] text-[var(--primary-coral)] text-xs">
                {errorMsg}
              </div>
            )}

            {resetSent ? (
              <div className="p-4 rounded-2xl bg-[var(--mint-surface)] border border-[var(--mint-success)]/30 text-xs text-[var(--mint-success)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password reset link sent! Check your inbox.</span>
              </div>
            ) : (
              <>
                <Input
                  label={t('auth.emailLabel')}
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
                  {t('auth.sendResetLink')}
                </Button>
              </>
            )}
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Tabs for Sign in / Sign up */}
            <Tabs
              tabs={[
                { id: 'signin', label: t('auth.signInTab') },
                { id: 'signup', label: t('auth.signUpTab') },
              ]}
              activeTab={activeTab}
              onChange={(id) => {
                setActiveTab(id as 'signin' | 'signup');
                setErrorMsg(null);
              }}
              className="w-full justify-center"
            />

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[var(--primary-coral-surface)] border border-[var(--primary-coral)]/30 text-xs text-[var(--primary-coral)] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google Fast Button */}
            <Button
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full text-sm font-bold"
            >
              {t('auth.googleButton')}
            </Button>

            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-[var(--border-default)] w-full" />
              <span className="bg-[var(--bg-card)] px-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Or with Email
              </span>
            </div>

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3.5">
              {activeTab === 'signup' && (
                <Input
                  label={t('auth.displayNameLabel')}
                  type="text"
                  placeholder={t('auth.displayNamePlaceholder')}
                  leftIcon={<User className="w-4 h-4" />}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              )}

              <Input
                label={t('auth.emailLabel')}
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                leftIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1">
                <Input
                  label={t('auth.passwordLabel')}
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  leftIcon={<Lock className="w-4 h-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText={activeTab === 'signup' ? 'Minimum 6 characters' : undefined}
                  required
                />
                {activeTab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="self-end text-xs text-[var(--primary-coral)] hover:underline mt-1 font-semibold"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full mt-2 font-semibold"
              >
                {activeTab === 'signin' ? t('auth.submitSignIn') : t('auth.submitSignUp')}
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
