import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getCountFromServer,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { getProductById } from './product-service';
import type { ProductItem } from '@/types';

// In-memory cache for count aggregations (TTL: 60 seconds)
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}
const countCache = new Map<string, CacheEntry<number>>();
const CACHE_TTL_MS = 60_000;

function getCachedCount(key: string): number | null {
  const entry = countCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.value;
  }
  return null;
}

function setCachedCount(key: string, value: number): void {
  countCache.set(key, { value, timestamp: Date.now() });
}

export function invalidateSocialCountCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    countCache.clear();
    return;
  }
  for (const key of countCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      countCache.delete(key);
    }
  }
}

// ==========================================
// FOLLOWS SERVICE
// follows/{followerId_followingId}
// ==========================================

export async function isFollowingUser(followerId: string, followingId: string): Promise<boolean> {
  if (!db || !followerId || !followingId || followerId === followingId) return false;
  try {
    const followDoc = await getDoc(doc(db, 'follows', `${followerId}_${followingId}`));
    return followDoc.exists();
  } catch (err) {
    console.warn('isFollowingUser error:', err);
    return false;
  }
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  if (!followerId) throw new Error('User must be signed in.');
  if (followerId === followingId) throw new Error('Cannot follow yourself.');

  const docId = `${followerId}_${followingId}`;
  await setDoc(doc(db, 'follows', docId), {
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  });

  // Invalidate count cache for this seller
  countCache.delete(`followers_${followingId}`);
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  if (!followerId) throw new Error('User must be signed in.');

  const docId = `${followerId}_${followingId}`;
  await deleteDoc(doc(db, 'follows', docId));

  // Invalidate count cache for this seller
  countCache.delete(`followers_${followingId}`);
}

export async function getFollowerCount(sellerId: string): Promise<number> {
  if (!db || !sellerId) return 0;
  const cacheKey = `followers_${sellerId}`;
  const cached = getCachedCount(cacheKey);
  if (cached !== null) return cached;

  try {
    const q = query(collection(db, 'follows'), where('followingId', '==', sellerId));
    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count;
    setCachedCount(cacheKey, count);
    return count;
  } catch (err) {
    console.warn('getFollowerCount error:', err);
    return 0;
  }
}

/**
 * Returns array of seller IDs that a given user is following
 */
export async function getFollowingSellerIds(followerId: string): Promise<string[]> {
  if (!db || !followerId) return [];
  try {
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', followerId),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data().followingId as string).filter(Boolean);
  } catch (err) {
    console.warn('getFollowingSellerIds error:', err);
    return [];
  }
}

// ==========================================
// LIKES SERVICE
// likes/{userId_productId}
// ==========================================

export async function hasUserLikedProduct(userId: string, productId: string): Promise<boolean> {
  if (!db || !userId || !productId) return false;
  try {
    const likeDoc = await getDoc(doc(db, 'likes', `${userId}_${productId}`));
    return likeDoc.exists();
  } catch (err) {
    console.warn('hasUserLikedProduct error:', err);
    return false;
  }
}

export async function likeProduct(userId: string, productId: string, sellerId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  if (!userId) throw new Error('User must be signed in.');

  const docId = `${userId}_${productId}`;
  await setDoc(doc(db, 'likes', docId), {
    userId,
    productId,
    sellerId: sellerId || '',
    createdAt: serverTimestamp(),
  });

  countCache.delete(`likes_${productId}`);
}

export async function unlikeProduct(userId: string, productId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  if (!userId) throw new Error('User must be signed in.');

  const docId = `${userId}_${productId}`;
  await deleteDoc(doc(db, 'likes', docId));

  countCache.delete(`likes_${productId}`);
}

export async function getProductLikeCount(productId: string): Promise<number> {
  if (!db || !productId) return 0;
  const cacheKey = `likes_${productId}`;
  const cached = getCachedCount(cacheKey);
  if (cached !== null) return cached;

  try {
    const q = query(collection(db, 'likes'), where('productId', '==', productId));
    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count;
    setCachedCount(cacheKey, count);
    return count;
  } catch (err) {
    console.warn('getProductLikeCount error:', err);
    return 0;
  }
}

// ==========================================
// SAVES SERVICE
// saves/{userId_productId}
// ==========================================

export async function hasUserSavedProduct(userId: string, productId: string): Promise<boolean> {
  if (!db || !userId || !productId) return false;
  try {
    const saveDoc = await getDoc(doc(db, 'saves', `${userId}_${productId}`));
    return saveDoc.exists();
  } catch (err) {
    console.warn('hasUserSavedProduct error:', err);
    return false;
  }
}

export async function saveProduct(userId: string, productId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  if (!userId) throw new Error('User must be signed in.');

  const docId = `${userId}_${productId}`;
  await setDoc(doc(db, 'saves', docId), {
    userId,
    productId,
    createdAt: serverTimestamp(),
  });
}

export async function unsaveProduct(userId: string, productId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  if (!userId) throw new Error('User must be signed in.');

  const docId = `${userId}_${productId}`;
  await deleteDoc(doc(db, 'saves', docId));
}

/**
 * Fetch all saved products for a user
 */
export async function getUserSavedProducts(userId: string): Promise<ProductItem[]> {
  if (!db || !userId) return [];
  try {
    const q = query(
      collection(db, 'saves'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    const productIds = snap.docs.map((d) => d.data().productId as string).filter(Boolean);

    if (productIds.length === 0) return [];

    // Fetch products in parallel
    const productPromises = productIds.map((id) => getProductById(id));
    const products = await Promise.all(productPromises);
    return products.filter((p): p is ProductItem => p !== null && p.status === 'published');
  } catch (err) {
    console.warn('getUserSavedProducts error:', err);
    return [];
  }
}

// ==========================================
// SELLER STATS
// ==========================================

export async function getSellerPublishedProductCount(sellerId: string): Promise<number> {
  if (!db || !sellerId) return 0;
  const cacheKey = `seller_prods_${sellerId}`;
  const cached = getCachedCount(cacheKey);
  if (cached !== null) return cached;

  try {
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerId),
      where('status', '==', 'published')
    );
    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count;
    setCachedCount(cacheKey, count);
    return count;
  } catch (err) {
    console.warn('getSellerPublishedProductCount error:', err);
    return 0;
  }
}
