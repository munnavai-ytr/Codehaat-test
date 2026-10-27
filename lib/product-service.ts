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
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { ref, deleteObject, type FirebaseStorage } from 'firebase/storage';
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

  // Clean up storage media if present
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
        const fileRef = urlOrPath.startsWith('gs://') || urlOrPath.startsWith('products/')
          ? ref(storage, urlOrPath)
          : ref(storage, urlOrPath);
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
