import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { generateSearchTokens, sanitizeDescription } from '@/config/products';
import type { ProductItem, UserProfile, ProductStatus } from '@/types';

export interface PublishingRequirementsCheck {
  canPublish: boolean;
  missingRequirements: string[];
}

export function checkPublishingRequirements(seller: UserProfile | null): PublishingRequirementsCheck {
  const missing: string[] = [];

  if (!seller || seller.isAnonymous) {
    missing.push('Permanent account required (Guests cannot publish)');
  }

  if (seller && !seller.emailVerified && seller.email) {
    missing.push('Verified email address required');
  }

  if (!seller?.sellerProfile?.brandName || !seller?.sellerProfile?.headline) {
    missing.push('Completed seller storefront profile required');
  }

  return {
    canPublish: missing.length === 0,
    missingRequirements: missing,
  };
}

/**
 * Saves or creates a product draft in Firestore products/{productId}
 */
export async function saveProductDraft(
  seller: UserProfile,
  data: Partial<ProductItem>,
  existingProductId?: string
): Promise<string> {
  if (!db) throw new Error('Firestore is not configured.');

  const productId = existingProductId || doc(collection(db, 'products')).id;
  const productRef = doc(db, 'products', productId);

  const title = (data.title || 'Untitled Draft').trim();
  const tags = data.tags || [];
  const techStack = data.techStack || [];
  const searchTokens = generateSearchTokens(title, tags, techStack);

  const payload: Record<string, unknown> = {
    id: productId,
    sellerId: seller.uid,
    sellerUsername: seller.username || seller.uid,
    sellerBrandName: seller.sellerProfile?.brandName || seller.displayName || 'Creator',
    sellerAvatarUrl: seller.sellerProfile?.avatarUrl || seller.photoURL || '',
    title,
    summary: (data.summary || '').trim(),
    description: sanitizeDescription(data.description || ''),
    category: data.category || 'web-apps',
    platforms: data.platforms || ['web'],
    techStack,
    tags,
    features: data.features || [],
    previewUrl: data.previewUrl || '',
    coverImage: data.coverImage || '',
    images: data.images || [],
    packages: data.packages || [],
    licenseType: data.licenseType || 'personal',
    demoAccessNote: (data.demoAccessNote || '').trim(),
    status: data.status === 'pending' ? 'pending' : (data.status || 'draft'),
    searchTokens,
    updatedAt: serverTimestamp(),
  };

  if (data.apk) {
    payload.apk = data.apk;
  }

  if (data.rejectionReason) {
    payload.rejectionReason = data.rejectionReason;
  }

  const snap = await getDoc(productRef);
  if (!snap.exists()) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(productRef, payload, { merge: true });
  return productId;
}

/**
 * Submits a product for admin review (changes status to pending)
 */
export async function submitProductForReview(
  productId: string,
  seller: UserProfile
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');

  const check = checkPublishingRequirements(seller);
  if (!check.canPublish) {
    throw new Error(`Cannot submit for review: ${check.missingRequirements.join(', ')}`);
  }

  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, {
    status: 'pending',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get all products for a given seller
 */
export async function getSellerProducts(sellerId: string): Promise<ProductItem[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerId),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => parseProductDoc(d.id, d.data()));
  } catch (err) {
    console.warn('getSellerProducts notice:', err);
    return [];
  }
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(productId: string): Promise<ProductItem | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) return null;
    return parseProductDoc(snap.id, snap.data());
  } catch (err) {
    console.warn('getProductById notice:', err);
    return null;
  }
}

/**
 * Duplicate an existing product as a new draft
 */
export async function duplicateProduct(
  productId: string,
  seller: UserProfile
): Promise<string> {
  const source = await getProductById(productId);
  if (!source) throw new Error('Source product not found.');

  const newDraftData: Partial<ProductItem> = {
    ...source,
    title: `Copy of ${source.title}`,
    status: 'draft',
    rejectionReason: undefined,
    publishedAt: undefined,
  };

  return await saveProductDraft(seller, newDraftData);
}

/**
 * Change status to unpublished
 */
export async function unpublishProduct(productId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  await updateDoc(doc(db, 'products', productId), {
    status: 'unpublished',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a product and its associated Storage media files
 */
export async function deleteProduct(productId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');

  const product = await getProductById(productId);

  if (product && storage) {
    const filesToDelete: string[] = [];
    if (product.coverImage && product.coverImage.includes('firebasestorage')) {
      filesToDelete.push(product.coverImage);
    }
    product.images.forEach((img) => {
      if (img && img.includes('firebasestorage')) filesToDelete.push(img);
    });
    if (product.apk?.storagePath) {
      filesToDelete.push(product.apk.storagePath);
    }

    for (const urlOrPath of filesToDelete) {
      try {
        const fileRef = ref(storage, urlOrPath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn('Storage file cleanup notice:', err);
      }
    }
  }

  await deleteDoc(doc(db, 'products', productId));
}

/**
 * Admin: Get all pending products awaiting approval
 */
export async function getPendingProductsForAdmin(): Promise<ProductItem[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => parseProductDoc(d.id, d.data()));
  } catch (err) {
    console.warn('getPendingProductsForAdmin notice:', err);
    return [];
  }
}

/**
 * Admin: Approve product and set status to published
 */
export async function adminApproveProduct(productId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  await updateDoc(doc(db, 'products', productId), {
    status: 'published',
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    rejectionReason: '',
  });
}

/**
 * Admin: Reject product with a required reason
 */
export async function adminRejectProduct(productId: string, reason: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  const trimmed = reason.trim();
  if (!trimmed) throw new Error('Rejection reason is required.');

  await updateDoc(doc(db, 'products', productId), {
    status: 'rejected',
    rejectionReason: trimmed,
    updatedAt: serverTimestamp(),
  });
}

export interface ExploreFilters {
  category?: string;
  platform?: string;
  techStack?: string;
  licenseType?: string;
  searchQuery?: string;
}

export interface PaginatedProductsResult {
  products: ProductItem[];
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  totalLoaded: number;
}

/**
 * Query published products with cursor pagination and optional filters
 */
export async function getPublishedProducts(
  filters: ExploreFilters = {},
  pageSize: number = 12,
  cursorDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedProductsResult> {
  if (!db) return { products: [], lastVisibleDoc: null, hasMore: false, totalLoaded: 0 };

  try {
    const constraints: QueryConstraint[] = [where('status', '==', 'published')];

    // Category filter
    if (filters.category && filters.category !== 'all') {
      constraints.push(where('category', '==', filters.category));
    }

    // License type filter
    if (filters.licenseType && filters.licenseType !== 'all') {
      constraints.push(where('licenseType', '==', filters.licenseType));
    }

    // Search query with searchTokens (array-contains-any up to 10 tokens)
    const rawQuery = filters.searchQuery?.trim().toLowerCase() || '';
    const queryTokens = rawQuery
      ? Array.from(new Set(rawQuery.split(/[\s,._-]+/).filter((t) => t.length >= 2))).slice(0, 10)
      : [];

    const hasSearchTokens = queryTokens.length > 0;
    if (hasSearchTokens) {
      constraints.push(where('searchTokens', 'array-contains-any', queryTokens));
    } else if (filters.platform && filters.platform !== 'all') {
      // Only add platform array-contains if searchTokens array-contains-any is not used
      constraints.push(where('platforms', 'array-contains', filters.platform));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (cursorDoc) {
      constraints.push(startAfter(cursorDoc));
    }

    // Fetch one extra item to accurately determine hasMore
    constraints.push(limit(pageSize + 1));

    const q = query(collection(db, 'products'), ...constraints);
    const snap = await getDocs(q);

    let docs = snap.docs;
    let items = docs.map((d) => ({ doc: d, item: parseProductDoc(d.id, d.data()) }));

    // Memory filter for platform if searchTokens was used
    if (hasSearchTokens && filters.platform && filters.platform !== 'all') {
      items = items.filter((i) => i.item.platforms.includes(filters.platform as any));
    }

    // Memory filter for techStack if specified
    if (filters.techStack && filters.techStack !== 'all') {
      const targetTech = filters.techStack.toLowerCase();
      items = items.filter((i) =>
        i.item.techStack.some((t) => t.toLowerCase() === targetTech)
      );
    }

    const hasMore = items.length > pageSize;
    const pageItems = items.slice(0, pageSize);
    const lastDoc = pageItems.length > 0 ? pageItems[pageItems.length - 1].doc : null;

    return {
      products: pageItems.map((p) => p.item),
      lastVisibleDoc: lastDoc,
      hasMore,
      totalLoaded: pageItems.length,
    };
  } catch (err) {
    console.warn('getPublishedProducts query notice:', err);
    return { products: [], lastVisibleDoc: null, hasMore: false, totalLoaded: 0 };
  }
}

/**
 * Fetch latest published products for Homepage feed
 */
export async function getLatestPublishedProducts(limitCount: number = 8): Promise<ProductItem[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => parseProductDoc(d.id, d.data()));
  } catch (err) {
    console.warn('getLatestPublishedProducts query notice:', err);
    return [];
  }
}

/**
 * Fetch more products by the same seller (published only)
 */
export async function getSellerPublishedProducts(
  sellerId: string,
  excludeProductId?: string,
  limitCount: number = 4
): Promise<ProductItem[]> {
  if (!db || !sellerId) return [];
  try {
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerId),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(limitCount + 1)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => parseProductDoc(d.id, d.data()))
      .filter((p) => p.id !== excludeProductId)
      .slice(0, limitCount);
  } catch (err) {
    console.warn('getSellerPublishedProducts query notice:', err);
    return [];
  }
}

/**
 * Fetch similar published products (same category or tags)
 */
export async function getSimilarPublishedProducts(
  category: string,
  tags: string[],
  excludeProductId?: string,
  limitCount: number = 4
): Promise<ProductItem[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'published'),
      where('category', '==', category),
      orderBy('createdAt', 'desc'),
      limit(limitCount + 2)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => parseProductDoc(d.id, d.data()))
      .filter((p) => p.id !== excludeProductId)
      .slice(0, limitCount);
  } catch (err) {
    console.warn('getSimilarPublishedProducts query notice:', err);
    return [];
  }
}

/**
 * Check if the user has already reported this product
 */
export async function hasUserReportedProduct(reporterUid: string, productId: string): Promise<boolean> {
  if (!db || !reporterUid || !productId) return false;
  try {
    const reportRef = doc(db, 'reports', `${reporterUid}_${productId}`);
    const snap = await getDoc(reportRef);
    return snap.exists();
  } catch {
    return false;
  }
}

/**
 * Report a product (creates document in reports/{reporterUid_productId})
 */
export async function submitProductReport(
  reporterUid: string,
  productId: string,
  reason: string,
  details?: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  if (!reporterUid) throw new Error('Authentication required to submit report.');
  if (!productId) throw new Error('Product ID is required.');
  if (!reason.trim()) throw new Error('Report reason is required.');

  const reportId = `${reporterUid}_${productId}`;
  const reportRef = doc(db, 'reports', reportId);

  await setDoc(reportRef, {
    id: reportId,
    reporterUid,
    productId,
    reason: reason.trim(),
    details: (details || '').trim(),
    createdAt: serverTimestamp(),
    status: 'pending',
  });
}

function parseProductDoc(id: string, data: Record<string, any>): ProductItem {
  return {
    id,
    sellerId: data.sellerId || '',
    sellerUsername: data.sellerUsername || '',
    sellerBrandName: data.sellerBrandName || '',
    sellerAvatarUrl: data.sellerAvatarUrl || '',
    title: data.title || '',
    summary: data.summary || '',
    description: data.description || '',
    category: data.category || 'web-apps',
    platforms: data.platforms || ['web'],
    techStack: data.techStack || [],
    tags: data.tags || [],
    features: data.features || [],
    previewUrl: data.previewUrl || '',
    apk: data.apk || undefined,
    coverImage: data.coverImage || '',
    images: data.images || [],
    packages: data.packages || [],
    licenseType: data.licenseType || 'personal',
    demoAccessNote: data.demoAccessNote || '',
    status: data.status || 'draft',
    rejectionReason: data.rejectionReason || '',
    searchTokens: data.searchTokens || [],
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
    publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate().toISOString() : data.publishedAt,
  };
}
