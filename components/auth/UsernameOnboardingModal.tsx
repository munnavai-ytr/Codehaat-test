'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, AtSign, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { validateUsername } from '@/lib/user-service';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import { brandConfig } from '@/src/config/brand';

export function UsernameOnboardingModal() {
  const { t } = useTranslation();
  const { user, needsUsernameOnboarding, setNeedsUsernameOnboarding, saveUsernameAndDisplayName } =
    useSession();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!needsUsernameOnboarding) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateUsername(username);
    if (!validation.valid) {
      if (validation.errorKey) {
        setError(t(`errors.${validation.errorKey}`));
      } else {
        setError(validation.message || 'Invalid username');
      }
      return;
    }

    if (!displayName.trim()) {
      setError(t('errors.required'));
      return;
    }

    setIsSubmitting(true);
    try {
      await saveUsernameAndDisplayName(username.trim(), displayName.trim());
      toast({
        title: 'Profile Ready!',
        message: `Welcome to ${brandConfig.name}, @${username.trim()}!`,
        type: 'success',
      });
      setNeedsUsernameOnboarding(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to claim username';
      if (msg.includes('already taken')) {
        setError(t('errors.usernameTaken'));
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={needsUsernameOnboarding}
      onClose={() => {
        // Must complete onboarding or can dismiss only if already has username
        if (user?.username) {
          setNeedsUsernameOnboarding(false);
        }
      }}
      title={t('auth.onboardingTitle')}
      description={t('auth.onboardingSubtitle')}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        {error && (
          <div className="p-3 rounded-2xl bg-[var(--primary-coral-surface)] border border-[var(--primary-coral)]/30 text-xs text-[var(--primary-coral)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label={t('auth.displayNameLabel')}
          type="text"
          placeholder={t('auth.displayNamePlaceholder')}
          leftIcon={<User className="w-4 h-4" />}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <Input
          label={t('auth.usernameLabel')}
          type="text"
          placeholder={t('auth.usernamePlaceholder')}
          leftIcon={<AtSign className="w-4 h-4" />}
          value={username}
          onChange={(e) => {
            const clean = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
            setUsername(clean);
          }}
          helperText={t('auth.usernameHelper')}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full mt-2"
        >
          {t('auth.completeOnboarding')}
        </Button>
      </form>
    </Modal>
  );
}
