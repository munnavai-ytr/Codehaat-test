import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { compressImage } from './user-service';

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Uploads product cover image or screenshot after client-side WebP compression
 */
export async function uploadProductImage(
  sellerId: string,
  productId: string,
  file: File,
  filename: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!storage) throw new Error('Firebase Storage is not configured.');

  // Compress image
  const blob = await compressImage(file, 1600, 1200, 0.82);
  const storagePath = `products/${sellerId}/${productId}/${filename}.webp`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, blob, {
    contentType: 'image/webp',
    customMetadata: {
      uploadedBy: sellerId,
      productId,
    },
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(percent);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });
}

/**
 * Uploads Android APK preview build (Max 100MB)
 */
export async function uploadProductApk(
  sellerId: string,
  productId: string,
  file: File,
  versionName: string,
  onProgress?: UploadProgressCallback
): Promise<{ storagePath: string; downloadUrl: string; sizeBytes: number; versionName: string }> {
  if (!storage) throw new Error('Firebase Storage is not configured.');

  if (file.size > 100 * 1024 * 1024) {
    throw new Error('APK file must be under 100MB.');
  }

  if (!file.name.endsWith('.apk') && file.type !== 'application/vnd.android.package-archive') {
    throw new Error('Only .apk files are supported for Android preview builds.');
  }

  const cleanVersion = versionName.trim() || '1.0.0';
  const storagePath = `products/${sellerId}/${productId}/preview_${cleanVersion.replace(/[^a-zA-Z0-9_\.]/g, '_')}.apk`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: 'application/vnd.android.package-archive',
    customMetadata: {
      uploadedBy: sellerId,
      productId,
      versionName: cleanVersion,
    },
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(percent);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          storagePath,
          downloadUrl,
          sizeBytes: file.size,
          versionName: cleanVersion,
        });
      }
    );
  });
}
