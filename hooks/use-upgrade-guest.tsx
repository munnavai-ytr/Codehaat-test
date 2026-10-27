'use client';

import { useState } from 'react';
import {
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  type AuthError,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { useSession } from '@/hooks/use-session';

export interface UseUpgradeGuestReturn {
  isUpgrading: boolean;
  error: string | null;
  credentialAlreadyInUse: boolean;
  attemptedProvider: 'google' | 'password' | null;
  attemptedEmail: string | null;
  linkGoogle: () => Promise<boolean>;
  linkEmailPassword: (email: string, pass: string) => Promise<boolean>;
  signInInstead: () => Promise<void>;
  resetState: () => void;
}

export function useUpgradeGuest(): UseUpgradeGuestReturn {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentialAlreadyInUse, setCredentialAlreadyInUse] = useState(false);
  const [attemptedProvider, setAttemptedProvider] = useState<'google' | 'password' | null>(null);
  const [attemptedEmail, setAttemptedEmail] = useState<string | null>(null);
  const { reloadUser, refreshProfile } = useSession();

  const resetState = () => {
    setError(null);
    setCredentialAlreadyInUse(false);
    setAttemptedProvider(null);
    setAttemptedEmail(null);
  };

  const handleAuthError = (err: unknown, provider: 'google' | 'password', email?: string) => {
    const authError = err as AuthError;
    if (
      authError.code === 'auth/credential-already-in-use' ||
      authError.code === 'auth/email-already-in-use' ||
      authError.message?.includes('already-in-use')
    ) {
      setCredentialAlreadyInUse(true);
      setAttemptedProvider(provider);
      if (email) setAttemptedEmail(email);
      setError(
        'This account is already registered. If you sign in to it, your current temporary guest data will not be merged.'
      );
    } else if (authError.code === 'auth/weak-password') {
      setError('Password is too weak. Please use at least 6 characters.');
    } else if (authError.code === 'auth/invalid-email') {
      setError('Invalid email address format.');
    } else {
      setError(authError.message || 'An error occurred during account linking.');
    }
  };

  const linkGoogle = async (): Promise<boolean> => {
    if (!isFirebaseConfigured || !auth || !auth.currentUser) {
      setError('Firebase authentication is not configured.');
      return false;
    }

    setIsUpgrading(true);
    resetState();

    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      await reloadUser();
      await refreshProfile();
      setIsUpgrading(false);
      return true;
    } catch (err) {
      handleAuthError(err, 'google');
      setIsUpgrading(false);
      return false;
    }
  };

  const linkEmailPassword = async (email: string, pass: string): Promise<boolean> => {
    if (!isFirebaseConfigured || !auth || !auth.currentUser) {
      setError('Firebase authentication is not configured.');
      return false;
    }

    setIsUpgrading(true);
    resetState();

    try {
      const credential = EmailAuthProvider.credential(email.trim(), pass);
      await linkWithCredential(auth.currentUser, credential);
      await reloadUser();
      await refreshProfile();
      setIsUpgrading(false);
      return true;
    } catch (err) {
      handleAuthError(err, 'password', email.trim());
      setIsUpgrading(false);
      return false;
    }
  };

  const signInInstead = async () => {
    if (!auth) return;
    setIsUpgrading(true);
    try {
      if (attemptedProvider === 'google') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else if (attemptedProvider === 'password' && attemptedEmail) {
        // Will prompt or redirect to login tab
      }
      await reloadUser();
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsUpgrading(false);
    }
  };

  return {
    isUpgrading,
    error,
    credentialAlreadyInUse,
    attemptedProvider,
    attemptedEmail,
    linkGoogle,
    linkEmailPassword,
    signInInstead,
    resetState,
  };
}
