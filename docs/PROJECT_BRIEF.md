# Dealwave — Product Brief & Source of Truth

> **Tagline:** "Preview. Talk. Deal."  
> **Brand Concept:** Ripples and waves in software discovery and commerce.

---

## 1. Product Summary
Dealwave is a free, software-only marketplace where developers and creators can publish, discover, and deal on apps, websites, UI templates, boilerplates, and source-code projects.

- **Brand Configuration:** All brand values (name, tagline, description, support email, palette) are centrally managed via `src/config/brand.ts` and can be customized via environment variables (`NEXT_PUBLIC_BRAND_NAME`, etc.).
- **Sellers:** Publish software products on an individual storefront profile and into the social discovery feed. Sellers can configure an optional AI sales agent that answers buyer inquiries automatically when offline.
- **Live Previews & Smart Links:** Every product features a live interactive preview. Sellers generate dedicated Smart Links. Visitors arriving through a link enter a dedicated, distraction-free "Deal Room" view with instant access to the preview and direct chat with the seller.
- **Guest-First Commerce:** Buyers do **not** need an account to browse, search, test live previews, or chat with sellers. Guests receive an automatic Firebase Anonymous Authentication session with a unique UID and label (e.g., `Guest 4F2A`).
- **Zero In-App Payments (V1):** Version 1 is 100% free with no payment gateway or fees. Deals are negotiated and settled directly outside the platform (via bank transfer, crypto, wire, PayPal, escrow, etc.).
- **Roadmap Extensibility:**
  - **V1.5:** Reviews & ratings, seller tier badges, verified creator checkmarks, notification polish, rich dynamic social share cards, link telemetry & analytics.
  - **V2:** External automated payment connections, automated Facebook page bot, automated source code & malware scanning.
  - **V3:** Developer hiring/contracting board, mobile app (PWA/native wrapper), specialized code categories.

---

## 2. Absolute Rules & Principles
1. **Production-Ready Only:** No mock data, no fake data, no placeholder content, no seeded demo records, no lorem ipsum, and no fake counters. Show real data from the backend. When there is no data, display a polished, honest empty state.
2. **Security First:** Never expose API keys, admin secrets, or cloud credentials in client-side code. All AI operations are proxied through server-side endpoints.
3. **End-to-End Verification:** Every feature built must function end-to-end.
4. **Architectural Modularity:** Keep code strongly typed (TypeScript), modular, decomposed into reusable components, hooks, features, and library utilities so subsequent prompts extend smoothly without rewrites.

---

## 3. 10-Prompt V1 Plan & Progress
- **Prompt 1: Foundation & Design System (COMPLETED)**
  - Folder architecture (`components`, `views`, `features`, `lib`, `hooks`, `styles`, `types`, `docs`)
  - "Aurora Glass" design system, CSS variables, theme toggle (light/dark/system), WCAG AA compliance
  - Full UI component library (Button, IconButton, Card, GlassCard, Input, Textarea, Select, Modal, BottomSheet, Toast, Skeleton, Avatar, Badge, Tabs, EmptyState, ErrorState, Spinner)
  - Responsive app shell: desktop left navigation rail, mobile bottom navigation bar, top bar with search trigger and theme switcher
  - Client router with complete route skeleton: `/`, `/explore`, `/p/:productId`, `/u/:username`, `/deal/:productId`, `/messages`, `/messages/:conversationId`, `/dashboard`, `/briefs`, `/admin`, `/login`, `/terms`, `/privacy`, and `404`
- **Prompt 2: Accounts, Guest Identity, Roles and Profiles (COMPLETED)**
  - Centralized brand configuration in `src/config/brand.ts`
  - Firebase Anonymous Authentication on first visit; persistent UID and friendly label ("Guest 4F2A")
  - Reusable `useUpgradeGuest` hook and `SaveAccountModal` using `linkWithCredential` for Google and Email/Password with `credential-already-in-use` handling
  - `/login` with Sign In, Sign Up, Google auth, Email/Password, Forgot password, and resend email verification
  - Firestore User Model in `users/{uid}` and unique username reservation in `usernames/{usernameLower}` via transactions
  - Post-signup onboarding step (`UsernameOnboardingModal`) to claim unique username
  - Admin role protection: documented in `/docs/ADMIN_SETUP.md`
  - "Become a seller" activation flow with avatar/cover uploads, client-side image compression (`compressImage`), and seller storefront (`/u/:username`)
  - Account settings (`/settings`): edit profile, seller storefront, change password with reauth, language preferences, and delete account with cleanup
  - Route guards: `RequireUser`, `RequireSeller`, and `RequireAdmin` with redirect return URLs
  - Dual-language i18n (`react-i18next`) with English and Bengali, and `LanguageSwitcher` in the top bar
  - Production `firestore.rules` and `storage.rules`, along with `/docs/DEPLOY_RULES.md`
- **Prompt 3: Product Creation, Seller Dashboard & Admin Review Queue (COMPLETED)**
  - Updated brand name to "CodeHaat", Bengali tagline "কোডের হাট", and English tagline "Preview. Talk. Deal." in `src/config/brand.ts`
  - V1 Scope enforced: No payment processing (informational prices with clear disclaimer) and no source code archive uploads
  - Product Firestore model in `products/{productId}` with full validation, sanitization, and search tokens
  - 6-step multi-step seller wizard modal with auto-drafting in Firestore, unsaved changes warnings, WebP compressed image uploads, and 100MB APK uploads to Firebase Storage
  - Seller Dashboard (`/dashboard`) with status tab counters (all, published, pending, draft, rejected, unpublished), product list, edit, duplicate, unpublish, and delete actions (with Storage asset cleanup)
  - Admin Review Queue (`/admin/review`) for `pending` products with approve (`published` + `publishedAt`) and reject (with required `rejectionReason`)
  - Updated `firestore.rules`, `storage.rules`, and created `firestore.indexes.json`
- **Prompt 4: Explore, Product Detail Page & Live Preview**
- **Prompt 5: Feed, Follow, Like, Save & Seller Storefront**
- **Prompt 6: Smart Links, Deal Room & Link Analytics**
- **Prompt 7: Real-Time Messenger**
- **Prompt 8: AI Sales Agent**
- **Prompt 9: Brief Board, Deal Tracker & Notifications**
- **Prompt 10: Admin, Moderation, Security, Performance & Legal Pages**

---

## 4. Role & Permissions Matrix
| Capability | Guest | Logged-In User | Seller | Admin |
|---|:---:|:---:|:---:|:---:|
| Browse Discovery Feed & Explore | Yes | Yes | Yes | Yes |
| Search & Filter Products | Yes | Yes | Yes | Yes |
| Run Interactive Live Previews | Yes | Yes | Yes | Yes |
| Enter "Deal Room" via Smart Links | Yes | Yes | Yes | Yes |
| Chat with Sellers & AI Agents (Auto Anonymous ID) | Yes | Yes | Yes | Yes |
| Save / Upgrade Account (Keep UID) | Yes | N/A | N/A | N/A |
| Like & Save / Bookmark Products | No | Yes | Yes | Yes |
| Follow Sellers | No | Yes | Yes | Yes |
| Post Project Briefs & Send Offers | No | Yes | Yes | Yes |
| Sync Chats & Contacts Across Devices | No | Yes | Yes | Yes |
| In-App Notification Center | No | Yes | Yes | Yes |
| Become a Seller & Upload Software | No | Yes | Yes | Yes |
| Access Seller Dashboard & Product Analytics | No | No | Yes | Yes |
| Configure Product AI Sales Agent | No | No | Yes | Yes |
| Platform Moderation, Approvals & Bans | No | No | No | Yes |

---

## 5. Firestore Data Model (Prompt 2)

### `users/{uid}`
```typescript
interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  username: string | null;
  usernameLower: string | null;
  photoURL: string | null;
  bio: string;
  role: 'guest' | 'user' | 'seller' | 'admin';
  locale: 'en' | 'bn';
  sellerProfile?: SellerProfile | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

### `usernames/{usernameLower}`
```typescript
interface UsernameClaim {
  uid: string;
  username: string;
  claimedAt: Timestamp;
}
```

### `sellerProfile` (Embedded in `users/{uid}`)
```typescript
interface SellerProfile {
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
```

---

## 6. Route Guards
- `RequireUser`: Protects `/settings`, requiring a permanent authenticated account. Unauthenticated guests are redirected with `?returnUrl=...`.
- `RequireSeller`: Protects `/dashboard`, requiring a registered seller profile. Prompts users to activate their seller profile at `/settings?tab=seller`.
- `RequireAdmin`: Protects `/admin`, ensuring only users with admin role or `mrmunnaofc@gmail.com` operator status can access moderation queues.

---
*Updated in Prompt 2. Treat as single source of truth across all subsequent prompts.*
