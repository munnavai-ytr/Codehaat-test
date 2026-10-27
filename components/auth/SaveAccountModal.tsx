'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Shield, AlertTriangle, Mail, Lock, ArrowRight, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUpgradeGuest } from '@/hooks/use-upgrade-guest';
import { useToast } from '@/hooks/use-toast';

interface SaveAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  customReason?: string;
  onSuccess?: () => void;
}

export function SaveAccountModal({ isOpen, onClose, customReason, onSuccess }: SaveAccountModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    isUpgrading,
    error,
    credentialAlreadyInUse,
    linkGoogle,
    linkEmailPassword,
    signInInstead,
    resetState,
  } = useUpgradeGuest();

  const [activeMethod, setActiveMethod] = useState<'options' | 'email'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleClose = () => {
    resetState();
    setActiveMethod('options');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFormError('');
    onClose();
  };

  const handleGoogleLink = async () => {
    const success = await linkGoogle();
    if (success) {
      toast({
        title: 'Account Saved!',
        message: 'Your guest session is now permanently linked to your Google account.',
        type: 'success',
      });
      handleClose();
      onSuccess?.();
    }
  };

  const handleEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password) {
      setFormError(t('errors.required'));
      return;
    }
    if (password.length < 6) {
      setFormError(t('errors.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setFormError(t('errors.passwordsDoNotMatch'));
      return;
    }

    const success = await linkEmailPassword(email, password);
    if (success) {
      toast({
        title: 'Account Saved!',
        message: 'Your guest session is now linked to your email and password.',
        type: 'success',
      });
      handleClose();
      onSuccess?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('guest.upgradeTitle')}
      description={customReason || t('guest.upgradeSubtitle')}
      maxWidth="md"
    >
      <div className="flex flex-col gap-5 pt-2">
        {customReason && (
          <div className="p-3 rounded-2xl bg-[var(--coral-surface)] border border-[var(--primary-coral)]/30 text-xs text-[var(--primary-coral)] font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{customReason}</span>
          </div>
        )}
        {/* Value Proposition bullets */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] flex flex-col gap-2 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
            <Sparkles className="w-4 h-4 text-[var(--mint-success)]" />
            <span>What happens when you save?</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[var(--mint-success)] shrink-0" />
              Retain your same UID
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[var(--mint-success)] shrink-0" />
              Keep message history
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[var(--mint-success)] shrink-0" />
              Unlock seller storefront
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[var(--mint-success)] shrink-0" />
              Like & bookmark projects
            </span>
          </div>
        </div>

        {/* Credential Already in Use Warning */}
        {credentialAlreadyInUse && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{t('guest.credentialInUseTitle')}</span>
            </div>
            <p className="leading-relaxed">{t('guest.credentialInUseDesc')}</p>
            <div className="pt-2 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  await signInInstead();
                  handleClose();
                }}
              >
                {t('guest.credentialInUseSignIn')}
              </Button>
              <Button variant="ghost" size="sm" onClick={resetState}>
                Try Different Account
              </Button>
            </div>
          </div>
        )}

        {/* Generic Error */}
        {error && !credentialAlreadyInUse && (
          <div className="p-3 rounded-xl bg-[var(--primary-coral-surface)] border border-[var(--primary-coral)]/30 text-xs text-[var(--primary-coral)]">
            {error}
          </div>
        )}

        {activeMethod === 'options' ? (
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              isLoading={isUpgrading}
              onClick={handleGoogleLink}
              className="w-full text-sm font-bold"
            >
              {t('guest.withGoogle')}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => setActiveMethod('email')}
              className="w-full text-sm font-semibold"
            >
              {t('guest.withEmail')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleEmailLink} className="flex flex-col gap-3">
            {formError && (
              <p className="text-xs text-[var(--primary-coral)] font-medium">{formError}</p>
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

            <Input
              label={t('auth.passwordLabel')}
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Minimum 6 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              leftIcon={<Lock className="w-4 h-4" />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setActiveMethod('options')}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isUpgrading}
                className="flex-1"
              >
                Link & Save Account
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
