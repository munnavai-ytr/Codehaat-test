# Deploying Firestore & Storage Security Rules and Indexes

This guide outlines the exact steps to publish the security rules in `firestore.rules`, `storage.rules`, and composite indexes in `firestore.indexes.json` to your Firebase project.

---

## Method 1: Using Firebase CLI (Recommended)

### Prerequisites
Make sure you have Node.js and the Firebase CLI installed:
```bash
npm install -g firebase-tools
```

### 1. Authenticate with Firebase
```bash
firebase login
```

### 2. Connect Your Project
In your project directory, associate your project ID:
```bash
firebase use --add <YOUR_FIREBASE_PROJECT_ID>
```

### 3. Deploy Firestore Rules
Deploys `firestore.rules` (including the published product read restrictions and `reports` collection rule):
```bash
firebase deploy --only firestore:rules
```

### 4. Deploy Storage Rules
Deploys `storage.rules`:
```bash
firebase deploy --only storage
```

### 5. Deploy Firestore Indexes
Deploys composite indexes defined in `firestore.indexes.json` for catalog search, category filtering, and sorting:
```bash
firebase deploy --only firestore:indexes
```

### 6. Deploy All Simultaneously
```bash
firebase deploy --only firestore:rules,storage,firestore:indexes
```

---

## Method 2: Via Firebase Console Web UI

### Firestore Rules
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project and navigate to **Build** > **Firestore Database**.
3. Click the **Rules** tab at the top.
4. Copy the entire contents of `firestore.rules` from this repository.
   - Now includes security validation for `follows`, `likes`, `saves`, and `reports`.
   - Requires permanent (non-anonymous) accounts for likes, follows, and saves.
   - Restricts saves read access exclusively to document owners.
5. Paste it into the editor and click **Publish**.

### Storage Rules
1. In the Firebase Console, navigate to **Build** > **Storage**.
2. Click the **Rules** tab at the top.
3. Copy the entire contents of `storage.rules` from this repository.
4. Paste it into the editor and click **Publish**.

### Firestore Composite Indexes
1. In the Firebase Console, navigate to **Build** > **Firestore Database** > **Indexes** tab.
2. If you execute a query from the application that requires a composite index that is not yet built, Firestore will log a direct index creation link in the browser developer console. Clicking that link opens the Firebase Console with all fields pre-filled.
3. Alternatively, deploy via `firebase deploy --only firestore:indexes` or click **Add index** with:
   - **`products`**:
     - Status (Ascending) + Category (Ascending) + CreatedAt (Descending)
     - Status (Ascending) + LicenseType (Ascending) + CreatedAt (Descending)
     - Status (Ascending) + Platforms (Arrays) + CreatedAt (Descending)
     - Status (Ascending) + SearchTokens (Arrays) + CreatedAt (Descending)
     - SellerId (Ascending) + Status (Ascending) + CreatedAt (Descending)
     - Status (Ascending) + SellerId (Ascending) + CreatedAt (Descending)
   - **`follows`**:
     - FollowerId (Ascending) + CreatedAt (Descending)
   - **`saves`**:
     - UserId (Ascending) + CreatedAt (Descending)

---

## Enabling Firebase App Check (Anti-Abuse Protection)

Firebase App Check verifies that incoming traffic originates from your genuine application and blocks unauthorized scrapers, bots, and curl abuse.

### Steps to Enable:
1. In the Firebase Console, navigate to **Build** > **App Check**.
2. Click **Register** for your Web App.
3. Choose **reCAPTCHA v3** or **reCAPTCHA Enterprise**.
4. Create an API Key in Google Cloud / reCAPTCHA Console and obtain your **Site Key** and **Secret Key**.
5. Save your **Secret Key** in the Firebase App Check configuration.
6. Add your **Site Key** to your `.env.local` file:
   ```bash
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
   ```
7. The application will automatically initialize App Check via `lib/app-check.ts`.
8. Once verified, turn on **Enforcement** for Cloud Firestore and Firebase Storage in the App Check dashboard.
