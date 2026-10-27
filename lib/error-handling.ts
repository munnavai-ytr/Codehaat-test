import { auth } from './firebase';
import { brandConfig } from '@/src/config/brand';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo: currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };

  const serialized = JSON.stringify(errInfo);
  console.error(`${brandConfig.name} Firestore Error:`, serialized);
  throw new Error(serialized);
}

/**
 * Returns a human-friendly translated error message for Firebase/Firestore/Storage errors.
 */
export function getFriendlyErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (
    lower.includes('permission-denied') ||
    lower.includes('permission_denied') ||
    lower.includes('unauthorized') ||
    lower.includes('storage/unauthorized')
  ) {
    return 'Permission denied: You do not have permission to perform this action. Ensure your account meets requirements (e.g. verified email, seller profile).';
  }

  if (lower.includes('unauthenticated')) {
    return 'Authentication required: Please sign in to complete this action.';
  }

  if (lower.includes('already-exists') || lower.includes('already exists')) {
    return 'This item already exists.';
  }

  if (lower.includes('not-found') || lower.includes('not found')) {
    return 'The requested resource was not found.';
  }

  return raw;
}
