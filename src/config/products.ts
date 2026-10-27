import type { ProductCategory, ProductPlatform, LicenseType } from '@/types';

export interface CategoryOption {
  id: ProductCategory;
  labelEn: string;
  labelBn: string;
}

export const PRODUCT_CATEGORIES: CategoryOption[] = [
  { id: 'web-apps', labelEn: 'Web apps', labelBn: 'ওয়েব অ্যাপস' },
  { id: 'mobile-apps', labelEn: 'Mobile apps', labelBn: 'মোবাইল অ্যাপস' },
  { id: 'websites-templates', labelEn: 'Websites and templates', labelBn: 'ওয়েবসাইট ও টেমপ্লেট' },
  { id: 'landing-pages', labelEn: 'Landing pages', labelBn: 'ল্যান্ডিং পেজ' },
  { id: 'admin-dashboards', labelEn: 'Admin dashboards', labelBn: 'অ্যাডমিন ড্যাশবোর্ড' },
  { id: 'games', labelEn: 'Games', labelBn: 'গেমস' },
  { id: 'bots-automation', labelEn: 'Bots and automation', labelBn: 'বট ও অটোমেশন' },
  { id: 'ui-kits', labelEn: 'UI kits', labelBn: 'ইউআই কিটস' },
  { id: 'scripts-plugins', labelEn: 'Scripts and plugins', labelBn: 'স্ক্রিপ্ট ও প্লাগইন' },
  { id: 'other', labelEn: 'Other', labelBn: 'অন্যান্য' },
];

export const PLATFORM_OPTIONS: { id: ProductPlatform; labelEn: string; labelBn: string }[] = [
  { id: 'web', labelEn: 'Web', labelBn: 'ওয়েব' },
  { id: 'android', labelEn: 'Android', labelBn: 'অ্যান্ড্রয়েড' },
  { id: 'ios', labelEn: 'iOS', labelBn: 'আইওএস' },
  { id: 'desktop', labelEn: 'Desktop', labelBn: 'ডেস্কটপ' },
];

export const LICENSE_OPTIONS: { id: LicenseType; labelEn: string; labelBn: string; descEn: string }[] = [
  { id: 'personal', labelEn: 'Personal License', labelBn: 'ব্যক্তিগত লাইসেন্স', descEn: 'For single personal project use' },
  { id: 'commercial', labelEn: 'Commercial License', labelBn: 'বাণিজ্যিক লাইসেন্স', descEn: 'For client or commercial product use' },
  { id: 'both', labelEn: 'Both (Personal & Commercial)', labelBn: 'উভয়ই (ব্যক্তিগত ও বাণিজ্যিক)', descEn: 'Full personal and commercial rights included' },
];

export const TECH_STACK_SUGGESTIONS = [
  'Next.js',
  'React',
  'TypeScript',
  'Tailwind CSS',
  'Node.js',
  'Express',
  'Flutter',
  'React Native',
  'Python',
  'Django',
  'FastAPI',
  'Vue.js',
  'Svelte',
  'Firebase',
  'Supabase',
  'PostgreSQL',
  'MongoDB',
  'GraphQL',
  'Docker',
  'Go',
  'Rust',
  'Unity',
  'Swift',
  'Kotlin',
];

export const CURRENCY_OPTIONS = ['USD', 'BDT', 'EUR', 'GBP'];

/**
 * Validates a live preview URL:
 * Must start with https://
 * Must not be localhost, 127.0.0.1, 0.0.0.0, or private IP ranges
 */
export function validatePreviewUrl(url: string): { valid: boolean; errorKey?: string; message?: string; normalizedUrl?: string } {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: true }; // Optional field
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
  } catch {
    return { valid: false, errorKey: 'invalidPreviewUrl', message: 'Preview URL is invalid. Must be a valid web address.' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, errorKey: 'previewUrlMustBeHttps', message: 'Preview URL must use secure HTTPS (e.g. https://...)' };
  }

  const hostname = parsed.hostname.toLowerCase();

  const isLocalOrPrivate =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname);

  if (isLocalOrPrivate) {
    return { valid: false, errorKey: 'previewUrlPrivateIp', message: 'Preview URL cannot point to localhost or private local IP ranges.' };
  }

  return { valid: true, normalizedUrl: parsed.toString() };
}

/**
 * Sanitizes rich text description to safe formatting (paragraphs, bold, italic, lists, links)
 */
export function sanitizeDescription(htmlString: string): string {
  if (!htmlString) return '';
  // Basic safe text sanitization removing scripts, style blocks, and iframe tags
  return htmlString
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Generate search tokens for simple Firestore token array filtering
 */
export function generateSearchTokens(title: string, tags: string[], techStack: string[]): string[] {
  const tokenSet = new Set<string>();

  const addWords = (text: string) => {
    const clean = text.toLowerCase().replace(/[^a-z0-9_\-\s]/g, ' ');
    clean.split(/\s+/).forEach((word) => {
      if (word.length >= 2) {
        tokenSet.add(word);
      }
    });
  };

  addWords(title);
  tags.forEach((t) => addWords(t));
  techStack.forEach((t) => addWords(t));

  return Array.from(tokenSet).slice(0, 30);
}
