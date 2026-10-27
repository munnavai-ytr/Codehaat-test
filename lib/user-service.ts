import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, SellerProfile } from '@/types';

export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'support',
  'help',
  'codehaat',
  'dealwave',
  'api',
  'login',
  'signin',
  'signup',
  'register',
  'explore',
  'briefs',
  'messages',
  'dashboard',
  'settings',
  'deal',
  'terms',
  'privacy',
  'mod',
  'moderator',
  'system',
  'official',
  'bot',
  'billing',
  'auth',
]);

export interface UsernameValidationResult {
  valid: boolean;
  errorKey?: 'usernameTooShort' | 'usernameTooLong' | 'usernameInvalid' | 'usernameReserved';
  message?: string;
}

export function validateUsername(username: string): UsernameValidationResult {
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { valid: false, errorKey: 'usernameTooShort', message: 'Username must be at least 3 characters.' };
  }
  if (trimmed.length > 24) {
    return { valid: false, errorKey: 'usernameTooLong', message: 'Username must be 24 characters or less.' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return {
      valid: false,
      errorKey: 'usernameInvalid',
      message: 'Username can only contain letters, numbers, and underscores.',
    };
  }
  const lower = trimmed.toLowerCase();
  if (RESERVED_USERNAMES.has(lower)) {
    return {
      valid: false,
      errorKey: 'usernameReserved',
      message: 'This username is reserved. Please choose another.',
    };
  }
  return { valid: true };
}

/**
 * Checks if the signed-in user exists in the admins/{uid} collection
 */
export async function checkIsAdmin(uid: string): Promise<boolean> {
  if (!db || !uid) return false;
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

/**
 * Transactionally claims a unique username and establishes the user profile document in Firestore.
 * Note: email is NOT written to the Firestore document (must come strictly from Firebase Auth).
 */
export async function claimUsernameAndCreateUser(
  firestore: Firestore,
  params: {
    uid: string;
    username: string;
    displayName: string;
    email?: string | null;
    isAnonymous: boolean;
    photoURL: string | null;
    bio?: string;
  }
): Promise<UserProfile> {
  const validation = validateUsername(params.username);
  if (!validation.valid) {
    throw new Error(validation.message || 'Invalid username');
  }

  const usernameClean = params.username.trim();
  const usernameLower = usernameClean.toLowerCase();
  const usernameRef = doc(firestore, 'usernames', usernameLower);
  const userRef = doc(firestore, 'users', params.uid);

  return await runTransaction(firestore, async (transaction) => {
    const usernameSnap = await transaction.get(usernameRef);
    if (usernameSnap.exists()) {
      const existingData = usernameSnap.data();
      if (existingData.uid !== params.uid) {
        throw new Error('This username is already taken. Please try another.');
      }
    }

    const existingUserSnap = await transaction.get(userRef);
    const existingUserData = existingUserSnap.exists() ? existingUserSnap.data() : null;

    // Preserve existing role unless promoted or existing
    const role = existingUserData?.role || (params.isAnonymous ? 'guest' : 'user');

    // Strictly matches userKeysOk() in firestore.rules (NO email field)
    const profileData: Record<string, unknown> = {
      uid: params.uid,
      displayName: params.displayName.trim() || usernameClean,
      username: usernameClean,
      usernameLower,
      isAnonymous: params.isAnonymous,
      photoURL: params.photoURL,
      bio: params.bio || existingUserData?.bio || '',
      role,
      locale: existingUserData?.locale || 'en',
      updatedAt: serverTimestamp(),
    };

    if (!existingUserSnap.exists()) {
      profileData.createdAt = serverTimestamp();
    }

    // Set username claim record
    transaction.set(usernameRef, {
      uid: params.uid,
      username: usernameClean,
      claimedAt: serverTimestamp(),
    });

    // Set user profile
    transaction.set(userRef, profileData, { merge: true });

    return {
      uid: params.uid,
      displayName: profileData.displayName as string,
      username: usernameClean,
      usernameLower,
      email: params.email || null,
      emailVerified: false,
      isAnonymous: params.isAnonymous,
      photoURL: params.photoURL,
      bio: profileData.bio as string,
      role,
      locale: (profileData.locale as 'en' | 'bn') || 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Fetch a user profile by UID. Email comes from Firebase Auth, not Firestore document.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: data.uid || uid,
      displayName: data.displayName || null,
      username: data.username || null,
      usernameLower: data.usernameLower || null,
      email: null, // Email comes strictly from Firebase Auth
      emailVerified: false,
      isAnonymous: Boolean(data.isAnonymous),
      photoURL: data.photoURL || null,
      bio: data.bio || '',
      role: data.role || 'user',
      locale: data.locale || 'en',
      sellerProfile: data.sellerProfile || null,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
  } catch (err) {
    console.warn('getUserProfile notice:', err);
    return null;
  }
}

/**
 * Lookup a user by their public username
 */
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  if (!db) return null;
  try {
    const lower = username.trim().toLowerCase();
    const unameSnap = await getDoc(doc(db, 'usernames', lower));
    if (!unameSnap.exists()) return null;
    const { uid } = unameSnap.data();
    if (!uid) return null;
    return await getUserProfile(uid);
  } catch (err) {
    console.warn('getUserByUsername notice:', err);
    return null;
  }
}

/**
 * Activate or update a seller profile
 */
export async function saveSellerProfile(
  uid: string,
  sellerProfile: SellerProfile
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    sellerProfile,
    role: 'seller',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Compress images client-side before uploading to Firebase Storage
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<Blob> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image file must be under 5MB.');
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, WEBP, and GIF images are supported.');
  }

  // If GIF, don't canvas-resize to preserve animation
  if (file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = height;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression.'));
    };
  });
}
