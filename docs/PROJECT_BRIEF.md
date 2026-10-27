# CodeHaat — Product Brief & Source of Truth

> **Tagline:** "Preview. Talk. Deal." (কোডের হাট)  
> **Brand Concept:** Ripples and waves in software discovery and direct commerce.

---

## 1. Product Summary
CodeHaat is a free, software-only marketplace where developers and creators can publish, discover, and deal on apps, websites, UI templates, boilerplates, and source-code projects.

- **Brand Configuration:** Centrally managed via `src/config/brand.ts` and customizable via environment variables (`NEXT_PUBLIC_BRAND_NAME`, etc.).
- **Feature Flags:** Centrally managed via `src/config/features.ts` (`chat: false`, `aiAgent: false`, `dealRoom: true`). Buttons for unreleased features do not appear in the UI.
- **Sellers:** Publish software products on an individual storefront profile and into the social discovery feed. Sellers can configure an optional AI sales agent in V1.
- **Live Previews & Smart Links:** Every product features a live interactive preview (`DeviceFramePreview`) supporting Mobile, Tablet, and Desktop responsive viewports with auto-scaling.
- **Guest-First Commerce:** Buyers do **not** need an account to browse, search, test live previews, or chat with sellers. Guests receive an automatic Firebase Anonymous Authentication session with a unique UID and friendly label (e.g., `Guest 4F2A`).
- **Zero In-App Payments (V1):** Version 1 is 100% free with no payment gateway or fees. Deals are negotiated and settled directly outside the platform (via bank transfer, crypto, wire, PayPal, escrow, etc.).

---

## 2. Absolute Rules & Principles
1. **Production-Ready Only:** No mock data, no fake data, no placeholder content, no seeded demo records, no lorem ipsum, and no fake counters. Show real data from the backend. When there is no data, display a polished, honest empty state.
2. **Security First:** Never expose API keys, admin secrets, or cloud credentials in client-side code. All AI operations are proxied through server-side endpoints.
3. **End-to-End Verification:** Every feature built must function end-to-end.
4. **Architectural Modularity:** Keep code strongly typed (TypeScript), modular, decomposed into reusable components, hooks, features, and library utilities so subsequent prompts extend smoothly without rewrites.
5. **i18n Requirement:** Complete bilingual coverage (English and Bengali) across all features in `lib/i18n.ts`.

---

## 3. 10-Prompt V1 Plan & Progress
- **Prompt 1: Foundation & Design System (COMPLETED)**
  - Folder architecture (`components`, `views`, `features`, `lib`, `hooks`, `styles`, `types`, `docs`)
  - "Aurora Glass" design system, CSS variables, theme toggle (light/dark/system), WCAG AA compliance
  - Full UI component library (Button, IconButton, Card, GlassCard, Input, Textarea, Select, Modal, BottomSheet, Toast, Skeleton, Avatar, Badge, Tabs, EmptyState, ErrorState, Spinner)
  - Responsive app shell: desktop left navigation rail, mobile bottom navigation bar, top bar with search trigger and theme switcher
  - Client router with complete route skeleton
- **Prompt 2: Accounts, Guest Identity, Roles and Profiles (COMPLETED)**
  - Centralized brand configuration in `src/config/brand.ts`
  - Firebase Anonymous Authentication on first visit; persistent UID and friendly label ("Guest 4F2A")
  - Reusable `useUpgradeGuest` hook and `SaveAccountModal` using `linkWithCredential`
  - `/login` with Sign In, Sign Up, Google auth, Email/Password, Forgot password, and resend email verification
  - Firestore User Model in `users/{uid}` and unique username reservation in `usernames/{usernameLower}` via transactions
  - Post-signup onboarding step (`UsernameOnboardingModal`) to claim unique username
  - Admin role protection: documented in `/docs/ADMIN_SETUP.md`
  - "Become a seller" activation flow with avatar/cover uploads, client-side image compression (`compressImage`), and seller storefront (`/u/:username`)
  - Account settings (`/settings`): edit profile, seller storefront, change password with reauth, language preferences, and delete account with cleanup
  - Dual-language i18n (`react-i18next`) with English and Bengali, and `LanguageSwitcher` in the top bar
  - Production `firestore.rules` and `storage.rules`, along with `/docs/DEPLOY_RULES.md`
- **Prompt 3: Product Creation, Seller Dashboard & Admin Review Queue (COMPLETED)**
  - Updated brand name to "CodeHaat", Bengali tagline "কোডের হাট", and English tagline "Preview. Talk. Deal."
  - Product Firestore model in `products/{productId}` with full validation, sanitization, and search tokens
  - 6-step multi-step seller wizard modal with auto-drafting in Firestore, unsaved changes warnings, WebP compressed image uploads, and 100MB APK uploads to Firebase Storage
  - Seller Dashboard (`/dashboard`) with status tab counters, product list, edit, duplicate, unpublish, and delete actions (with Storage asset cleanup)
  - Admin Review Queue (`/admin/review`) for `pending` products with approve (`published` + `publishedAt`) and reject (with required `rejectionReason`)
- **Prompt 4: Explore, Product Detail Page & Live Preview (COMPLETED)**
  - Global feature flags in `src/config/features.ts` (`chat: false`, `aiAgent: false`, `dealRoom: true`)
  - Layout baseline: bottom tab bar below 1024px (`lg:hidden`), desktop navigation rail at 1024px+ (`hidden lg:flex`), top bar phone thresholds, 16px font inputs to prevent mobile zoom, enter-only 150ms 6px slide page transitions with `prefers-reduced-motion` support
  - Explore page (`/explore`): real Firestore query of published products with cursor pagination (12 per page), keyword search matching `searchTokens`, filter dropdowns (category, platform, tech stack, license), URL query synchronization, active filter removable chips, responsive grid (1 col phone, 2 tablet, 3 laptop, 4 wide screen), skeleton loaders, and 2 distinct empty states
  - Reusable `ProductCard` with 16:9 aspect ratio to avoid layout shift, seller avatar/name, platform icons, lowest package price labeled informational as set by seller, and card click routing
  - Reusable `DeviceFramePreview` component with Mobile (390×844), Tablet (820×1180), and Desktop (1280×800) frames scaled via `ResizeObserver` and CSS transform, orientation rotation, reload, open in new tab, fullscreen with iOS fallback, sandboxed iframe, and 8-second embedding notice
  - Product Detail Page (`/p/:productId`): image gallery with touch swipe, keyboard arrows, thumbnail carousel, and fullscreen lightbox; full metadata, features list, tech stack, demo credentials note; pricing packages with informational non-payment notice; seller profile card; real queries for "More from this seller" and "Similar products" (hidden when empty); APK download with version & size; link copy & Web Share API; report modal creating `reports/{uid_productId}`; owner/admin "Not public yet" banner
  - Home Page (`/`): updated with category shortcuts from `PRODUCT_CATEGORIES` and "Latest software listings" from real published Firestore products (hidden when empty)
  - Updated `firestore.rules` for published product access and `reports` creation with field validation; updated `firestore.indexes.json`
- **Prompt 5: Feed, Follow, Like, Save & Seller Storefront [COMPLETED]**
  - Feed (`/` and `/feed`): "Latest" and "Following" tabs; Following queries chunked in 30-seller batches with merged `createdAt` sort; single column mobile / ~600px centered column desktop; FeedCard with touch swipe image carousel, like with real count and optimistic rollback, save with optimistic rollback, quick live preview (`DeviceFramePreview` modal), link copy/share; infinite scroll sentinel + fallback load more button
  - Require-Login Flow: guests tapping like/save/follow trigger the Save account modal with context explanation; action automatically resumes upon login/upgrade; optimistic UI with rollback on failure; double-tap guard
  - Saved Products (`/saved`, signed-in users only): real Firestore grid of user's saved items with unsave action; navigation links in user menu and desktop rail
  - Seller Storefront (`/u/:username`): cover, avatar, brand name, headline, bio, skills, languages, location, external links, real member-since date; real stats via Firestore `getCountFromServer` (published products count, follower count) with in-memory TTL caching; follow/unfollow toggle; owner edit profile button; message button behind `featureFlags.chat`; tabs (Products & About); handles 404, sellers without products, and seller viewing their own page; title sync
  - Security rules & indexes: `follows`, `likes`, `saves` with permanent-user enforcement, ID verification, no self-follow, owner-only read for saves, public read for likes/follows; composite indexes in `firestore.indexes.json`
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
| Report Harmful / Malicious Products | Yes | Yes | Yes | Yes |
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

## 5. Firestore Data Model
- `users/{uid}`: Profile and optional embedded `sellerProfile`
- `usernames/{usernameLower}`: Unique username reservation claim
- `products/{productId}`: Software product listing (`published`, `pending`, `draft`, `rejected`, `unpublished`)
- `reports/{reporterUid_productId}`: Product moderation reports (`pending`, `reviewed`)
- `follows/{followerId_followingId}`: Follower social graph records (`followerId`, `followingId`, `createdAt`)
- `likes/{userId_productId}`: Product likes (`userId`, `productId`, `sellerId`, `createdAt`)
- `saves/{userId_productId}`: User saved products (`userId`, `productId`, `createdAt`)
- `admins/{uid}`: Manual document existence indicates root admin status
