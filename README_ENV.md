# NutriTrack v2 – Required Environment Variables

Set these in your Vercel project dashboard under **Settings → Environment Variables**
(or in a local `.env.local` file for development).

---

## Firebase Client SDK  *(public – baked into browser bundle)*

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key (from Firebase Console → Project settings → General) | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc123` |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push VAPID public key (optional – for push notifications) | `BNjs...` |

---

## Firebase Admin SDK  *(server-only – never exposed to the browser)*

These are used by `lib/firebase-admin.config.js` to initialize the Firebase Admin SDK
on the server (API routes, Server Components, middleware verification).

| Variable | Description | How to get it |
|---|---|---|
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase project ID (same as `NEXT_PUBLIC_FIREBASE_PROJECT_ID`) | Firebase Console → Project settings → General |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account email | Firebase Console → Project settings → **Service accounts** → Generate new private key |
| `FIREBASE_ADMIN_PRIVATE_KEY` | RSA private key from service account JSON | Paste the raw `private_key` value from the downloaded JSON (Vercel handles `\n` escaping automatically) |

> **Important:** The `FIREBASE_ADMIN_PRIVATE_KEY` value should be pasted as-is including the
> `-----BEGIN PRIVATE KEY-----` header/footer. Vercel stores it correctly.
> In local `.env.local` wrap the value in double-quotes and use `\n` for newlines.

### Service account JSON → environment variables

1. Go to **Firebase Console → Project settings → Service accounts**
2. Click **Generate new private key** → download the JSON file
3. Map the JSON fields:

```json
{
  "project_id":   → FIREBASE_ADMIN_PROJECT_ID
  "client_email": → FIREBASE_ADMIN_CLIENT_EMAIL
  "private_key":  → FIREBASE_ADMIN_PRIVATE_KEY
}
```

---

## Nutrition API

| Variable | Description | Default |
|---|---|---|
| `EDAMAM_APP_ID` | Edamam Food Database App ID | *(required for Edamam backend)* |
| `EDAMAM_APP_KEY` | Edamam Food Database App Key | *(required for Edamam backend)* |
| `NUTRITION_API_BASE_URL` | Edamam API base URL | `https://api.edamam.com/api/food-database/v2` |
| `NUTRITION_API_BACKEND` | Switch backend: `edamam` or `open-food-facts` | `edamam` |

> The `open-food-facts` backend requires no API key and is free to use.

---

## App Configuration

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployed app (used for metadata / OG tags) | `https://nutritrack.it` |
| `ADMIN_EMAIL` | Email address of the admin user (gets `role: 'admin'` on registration) | `admin@nutritrack.it` |

---

## Session Cookie

NutriTrack uses **Firebase session cookies** (server-side, HttpOnly) managed via the
`/api/login` route (7-day expiry) and synced by the `AuthProvider` component.

No additional environment variables are required for session management beyond the
Firebase Admin SDK variables listed above.

---

## Local development checklist

```bash
# 1. Copy example env file
cp .env.example .env.local

# 2. Fill in all variables above in .env.local

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

> **Never commit `.env.local`** to version control – it is already listed in `.gitignore`.
