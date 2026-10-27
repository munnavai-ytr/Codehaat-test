export type UserRole = 'guest' | 'user' | 'seller' | 'admin';
export type SessionStatus = 'loading' | 'guest' | 'user';

export interface SellerProfile {
  brandName: string;
  headline: string;
  bio: string;
  skills: string[];
  location?: string;
  languages: string[];
  websiteUrl?: string;
  githubUrl?: string;
  xUrl?: string;
  avatarUrl?: string;
  coverUrl?: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  username: string | null;
  usernameLower?: string | null;
  photoURL: string | null;
  bio?: string;
  role: UserRole;
  locale: 'en' | 'bn';
  sellerProfile?: SellerProfile | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionContextType {
  user: UserProfile | null;
  status: SessionStatus;
  isGuest: boolean;
  isAuthenticated: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  firebaseConfigured: boolean;
  needsUsernameOnboarding: boolean;
  setNeedsUsernameOnboarding: (val: boolean) => void;
  saveUsernameAndDisplayName: (username: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export type ProductCategory =
  | 'web-apps'
  | 'mobile-apps'
  | 'websites-templates'
  | 'landing-pages'
  | 'admin-dashboards'
  | 'games'
  | 'bots-automation'
  | 'ui-kits'
  | 'scripts-plugins'
  | 'other';

export type ProductPlatform = 'web' | 'android' | 'ios' | 'desktop';
export type LicenseType = 'personal' | 'commercial' | 'both';
export type ProductStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'unpublished';

export interface ProductPackage {
  id: string;
  name: string;
  description: string;
  priceAmount: number;
  currency: string;
  deliveryDays: number;
  includes: string[];
}

export interface ApkInfo {
  storagePath: string;
  downloadUrl: string;
  sizeBytes: number;
  versionName: string;
}

export interface ProductItem {
  id: string;
  sellerId: string;
  sellerUsername: string;
  sellerBrandName?: string;
  sellerAvatarUrl?: string;
  title: string;
  summary: string;
  description: string;
  category: ProductCategory;
  platforms: ProductPlatform[];
  techStack: string[];
  tags: string[];
  features: string[];
  previewUrl?: string;
  apk?: ApkInfo;
  coverImage: string;
  images: string[];
  packages: ProductPackage[];
  licenseType: LicenseType;
  demoAccessNote?: string;
  status: ProductStatus;
  rejectionReason?: string;
  searchTokens: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
