'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { getUserProfile, claimUsernameAndCreateUser, checkIsAdmin } from '@/lib/user-service';
import { brandConfig } from '@/src/config/brand';
import type { SessionContextType, UserProfile, SessionStatus, UserRole } from '@/types';

const GUEST_STORAGE_KEY = `${brandConfig.name.toLowerCase()}_guest_identity`;

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function getFallbackGuestIdentity(): UserProfile {
  let storedUid = '';
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.uid) return parsed;
      }
    } catch {
      // ignore
    }
  }

  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const guestUid = storedUid || `guest_${randomSuffix.toLowerCase()}`;
  const profile: UserProfile = {
    uid: guestUid,
    isAnonymous: true,
    email: null,
    emailVerified: false,
    displayName: `Guest ${randomSuffix}`,
    username: null,
    photoURL: null,
    role: 'guest',
    locale: 'en',
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  return profile;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getFallbackGuestIdentity());
  const [status, setStatus] = useState<SessionStatus>(() =>
    isFirebaseConfigured && auth ? 'loading' : 'guest'
  );
  const [needsUsernameOnboarding, setNeedsUsernameOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(() => Boolean(isFirebaseConfigured && auth));

  // Sync profile from Firestore or Auth
  const syncProfile = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      // Anonymous Guest fallback
      const fallback = getFallbackGuestIdentity();
      setUser(fallback);
      setStatus('guest');
      setIsLoading(false);
      return;
    }

    if (firebaseUser.isAnonymous) {
      // Guest with real Firebase anonymous UID
      const guestSuffix = firebaseUser.uid.slice(-4).toUpperCase();
      const guestProfile: UserProfile = {
        uid: firebaseUser.uid,
        isAnonymous: true,
        email: null,
        emailVerified: false,
        displayName: firebaseUser.displayName || `Guest ${guestSuffix}`,
        username: null,
        photoURL: null,
        role: 'guest',
        locale: 'en',
        createdAt: new Date().toISOString(),
      };
      setUser(guestProfile);
      setStatus('guest');
      setIsLoading(false);
      return;
    }

    // Permanent authenticated user
    const firestoreProfile = await getUserProfile(firebaseUser.uid);
    const isAdminUser = await checkIsAdmin(firebaseUser.uid);

    const role: UserRole = (isAdminUser || firestoreProfile?.role === 'admin')
      ? 'admin'
      : (firestoreProfile?.role || 'user');

    const mergedProfile: UserProfile = {
      uid: firebaseUser.uid,
      isAnonymous: false,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      displayName: firestoreProfile?.displayName || firebaseUser.displayName || 'Member',
      username: firestoreProfile?.username || null,
      usernameLower: firestoreProfile?.usernameLower || null,
      photoURL: firestoreProfile?.photoURL || firebaseUser.photoURL || null,
      bio: firestoreProfile?.bio || '',
      role,
      locale: firestoreProfile?.locale || 'en',
      sellerProfile: firestoreProfile?.sellerProfile || null,
      createdAt: firestoreProfile?.createdAt,
      updatedAt: firestoreProfile?.updatedAt,
    };

    setUser(mergedProfile);
    setStatus('user');
    setIsLoading(false);

    // If permanent user lacks a unique username claim, prompt onboarding
    if (!mergedProfile.username) {
      setNeedsUsernameOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const activeAuth = auth;
      const unsubscribe = onAuthStateChanged(activeAuth, async (firebaseUser) => {
        if (!firebaseUser) {
          // On first visit, sign in anonymously so visitor has real uid
          try {
            await signInAnonymously(activeAuth);
          } catch (err) {
            console.warn('Anonymous auth auto-sign-in note:', err);
            // Fallback to local guest identity if anonymous auth disabled in console
            await syncProfile(null);
          }
        } else {
          await syncProfile(firebaseUser);
        }
      });

      return () => unsubscribe();
    }
  }, [syncProfile]);

  const reloadUser = async () => {
    if (auth?.currentUser) {
      await auth.currentUser.reload();
      await syncProfile(auth.currentUser);
    }
  };

  const refreshProfile = async () => {
    if (auth?.currentUser) {
      await syncProfile(auth.currentUser);
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await syncProfile(result.user);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await syncProfile(result.user);
  };

  const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName?.trim()) {
      await updateProfile(result.user, { displayName: displayName.trim() });
    }
    try {
      await sendEmailVerification(result.user);
    } catch (err) {
      console.warn('Email verification send notice:', err);
    }
    await syncProfile(result.user);
  };

  const saveUsernameAndDisplayName = async (username: string, displayName: string) => {
    if (!user || !db) {
      throw new Error('Database is not available.');
    }
    const profile = await claimUsernameAndCreateUser(db, {
      uid: user.uid,
      username,
      displayName,
      email: user.email,
      isAnonymous: user.isAnonymous,
      photoURL: user.photoURL,
    });
    setUser((prev) => (prev ? { ...prev, ...profile, email: user.email } : profile));
    setNeedsUsernameOnboarding(false);
  };

  const logout = async () => {
    if (auth && isFirebaseConfigured) {
      const activeAuth = auth;
      await signOut(activeAuth);
      // Auto sign back into anonymous session
      try {
        await signInAnonymously(activeAuth);
      } catch {
        setUser(getFallbackGuestIdentity());
        setStatus('guest');
      }
    } else {
      setUser(getFallbackGuestIdentity());
      setStatus('guest');
    }
  };

  const isGuest = status === 'guest';
  const isAuthenticated = status === 'user';
  const isSeller = Boolean(user && (user.role === 'seller' || user.role === 'admin'));
  const isAdmin = Boolean(user && user.role === 'admin');

  return (
    <SessionContext.Provider
      value={{
        user,
        status,
        isGuest,
        isAuthenticated,
        isSeller,
        isAdmin,
        isLoading,
        firebaseConfigured: isFirebaseConfigured,
        needsUsernameOnboarding,
        setNeedsUsernameOnboarding,
        saveUsernameAndDisplayName,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        reloadUser,
        refreshProfile,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
