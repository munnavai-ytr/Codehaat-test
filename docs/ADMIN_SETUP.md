# Administrator Security & Setup Guide

In the application, the `admin` role grants critical permissions (content moderation, product approvals, user bans, and platform configuration). 

**Security Invariant:** To prevent privilege escalation attacks, admin status can **never** be assigned or modified from the client SDK. Security rules strictly forbid users from modifying their own role or creating admin records.

---

## 1. Granting Admin Access via Firebase Console

In `firestore.rules`, an authenticated user is recognized as an administrator if and only if a document exists at `/admins/{uid}`:

```rules
match /admins/{adminUid} {
  allow get: if isOwner(adminUid);
  allow list, write: if false;
}
```

To grant administrator access to a user account:

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Firestore Database** > **Data**.
3. Click **Start collection** (or select the existing `admins` collection) with Collection ID: `admins`.
4. Create a document where the Document ID is set to the user's exact Firebase Auth `uid` (found in **Firebase Console** > **Authentication** > **Users**).
5. Add document fields (optional metadata):
   - `grantedAt`: (timestamp) current time
   - `grantedBy`: "manual-admin-grant"
6. Once the document `/admins/{uid}` exists, the user will be recognized as an administrator upon signing in.

---

## 2. Verifying Admin Access in the Application

1. Sign in with your administrator account credentials.
2. Visit `/admin` or click **Admin Console** in the navigation rail.
3. The Admin Console will display **Admin Clearance** and unlock moderation and approval queues.
