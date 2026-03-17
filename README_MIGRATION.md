# NutriTrack – GitHub Pages → Vercel Migration Guide

> **Domain:** nutritrack.it (registered on GoDaddy)
> **Stack:** Next.js 14 App Router · Firebase · Vercel

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Firebase Setup](#3-firebase-setup)
4. [Vercel Deployment](#4-vercel-deployment)
5. [GoDaddy DNS Configuration](#5-godaddy-dns-configuration)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Firestore Security Rules](#7-firestore-security-rules)
8. [Post-Deployment Checklist](#8-post-deployment-checklist)
9. [Rollback Plan](#9-rollback-plan)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Architecture Overview

```
Browser
  │
  ├─ HTTPS ──► Vercel Edge (CDN + Security Headers)
  │               │
  │               ├─ Next.js App Router (SSR / RSC)
  │               │    ├─ /app/dashboard  ← Server Component (auth + data fetch)
  │               │    ├─ /app/login      ← Client Component (Firebase Auth)
  │               │    └─ /app/api/*      ← Vercel Serverless Functions
  │               │         ├─ /api/nutrition/search  (proxied, SWR cached)
  │               │         ├─ /api/storage/sign      (server-signed uploads)
  │               │         ├─ /api/meals             (CRUD via Repository)
  │               │         └─ /api/auth/session      (HttpOnly session cookie)
  │               │
  │               └─ lib/repositories/*  ← Repository Pattern (firebase-admin)
  │
  ├─ Firebase Auth   (client-side ID token → server session cookie)
  ├─ Firestore       (accessed server-side via firebase-admin)
  └─ Firebase Storage (client uploads via server-signed URLs)
```

---

## 2. Prerequisites

- [ ] Node.js ≥ 18 installed locally
- [ ] Vercel CLI: `npm i -g vercel`
- [ ] Firebase project: `dietapp-8ad72` (existing)
- [ ] GoDaddy account with DNS access to `nutritrack.it`
- [ ] Firebase service account key (generated below)

---

## 3. Firebase Setup

### 3.1 Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com) → `dietapp-8ad72`
2. Navigate to **Project Settings** → **Service Accounts**
3. Click **Generate new private key**
4. Save as `serviceAccountKey.json` locally (**DO NOT commit this file**)
5. Extract the required values for Vercel env vars:

```bash
# Extract values from the JSON key file
cat serviceAccountKey.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('FIREBASE_ADMIN_PROJECT_ID=' + d['project_id'])
print('FIREBASE_ADMIN_CLIENT_EMAIL=' + d['client_email'])
print('FIREBASE_ADMIN_PRIVATE_KEY=' + d['private_key'].replace('\n', '\\\\n'))
"
```

### 3.2 Enable Session Cookies in Firebase

Session cookies require the Firebase Auth REST API to be enabled.
No additional configuration needed – `createSessionCookie()` works with any Firebase project.

### 3.3 Update Authorized Domains

In Firebase Console → **Authentication** → **Settings** → **Authorized domains**, add:

- `nutritrack.it`
- `www.nutritrack.it`
- `<your-vercel-preview>.vercel.app` (for preview deployments)

### 3.4 Update Firestore Security Rules

Deploy the security rules from [Section 7](#7-firestore-security-rules):

```bash
firebase deploy --only firestore:rules
```

---

## 4. Vercel Deployment

### 4.1 Initial Setup

```bash
# Install dependencies
npm install

# Login to Vercel
vercel login

# Link to Vercel project (creates .vercel/ directory)
vercel link
```

### 4.2 Configure Environment Variables

**Option A: Via Vercel Dashboard (recommended for production)**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → your project → **Settings** → **Environment Variables**
2. Add all variables from [Section 6](#6-environment-variables-reference)
3. Set scope: **Production** (and optionally **Preview**)

**Option B: Via CLI**

```bash
# Add each variable (you'll be prompted for the value)
vercel env add FIREBASE_ADMIN_PROJECT_ID production
vercel env add FIREBASE_ADMIN_CLIENT_EMAIL production
vercel env add FIREBASE_ADMIN_PRIVATE_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# ... repeat for all variables
```

**Option C: For local development**

```bash
# Copy the example file
cp .env.example .env.local
# Fill in your values
nano .env.local
```

### 4.3 Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

---

## 5. GoDaddy DNS Configuration

> **Important:** DNS changes typically propagate within 30 minutes but can take up to 48 hours.

### 5.1 Access GoDaddy DNS Management

1. Log in to [GoDaddy](https://www.godaddy.com) → **My Products**
2. Click **DNS** next to `nutritrack.it`

### 5.2 Configure DNS Records

Remove any existing A records and CNAME records for `@` and `www`, then add:

#### Record 1 – Apex domain (@)

| Type | Name | Value         | TTL  |
|------|------|---------------|------|
| A    | `@`  | `76.76.21.21` | 600  |

#### Record 2 – WWW subdomain

| Type  | Name  | Value                  | TTL  |
|-------|-------|------------------------|------|
| CNAME | `www` | `cname.vercel-dns.com` | 3600 |

> **Note:** If GoDaddy shows "CNAME flattening" for the apex domain,
> you only need the A record. The CNAME is for `www` only.

### 5.3 Step-by-Step GoDaddy Instructions

1. In the DNS Management page, scroll to **Records**
2. **Add A record:**
   - Click **Add** → Type: **A**
   - Name: `@`
   - Value: `76.76.21.21`
   - TTL: `600 seconds` (1/2 Hour)
   - Click **Save**

3. **Add CNAME record:**
   - Click **Add** → Type: **CNAME**
   - Name: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: `1 Hour`
   - Click **Save**

4. **Delete old records:**
   - Delete any existing `A` record pointing to GitHub Pages (`185.199.x.x` addresses)
   - Delete any existing `CNAME` for `www` pointing to GitHub

### 5.4 Configure Domain in Vercel

```bash
# Add the domain to your Vercel project
vercel domains add nutritrack.it
vercel domains add www.nutritrack.it
```

Or via Dashboard → **Settings** → **Domains** → Add `nutritrack.it`

Vercel will automatically provision an SSL certificate via Let's Encrypt.

### 5.5 Verify DNS Propagation

```bash
# Check A record
dig A nutritrack.it +short
# Expected: 76.76.21.21

# Check CNAME
dig CNAME www.nutritrack.it +short
# Expected: cname.vercel-dns.com.

# Check SSL
curl -I https://nutritrack.it
# Expected: HTTP/2 200
```

Online tools: [dnschecker.org](https://dnschecker.org) | [whatsmydns.net](https://www.whatsmydns.net)

---

## 6. Environment Variables Reference

### Required – Firebase Admin (Server Only)

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase project ID | Service account JSON → `project_id` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account email | Service account JSON → `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | RSA private key (escape `\n`) | Service account JSON → `private_key` |

### Required – Firebase Client (Public)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `dietapp-8ad72.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `dietapp-8ad72` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `dietapp-8ad72.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `903928286116` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | FCM VAPID key |

### Optional – Nutrition API

| Variable | Description |
|----------|-------------|
| `EDAMAM_APP_ID` | Edamam Food DB app ID |
| `EDAMAM_APP_KEY` | Edamam Food DB key |
| `NUTRITION_API_BACKEND` | `edamam` (default) or `open-food-facts` |

### Optional – App Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://nutritrack.it` | Canonical URL |
| `ADMIN_EMAIL` | `admin@nutritrack.it` | Admin account email |

---

## 7. Firestore Security Rules

Deploy these rules to maintain data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User profiles – owner only
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Diary – owner only, validated structure
    match /users/{uid}/diary/{date} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /meals/{mealId} {
        allow read: if request.auth != null && request.auth.uid == uid;
        allow create: if request.auth != null
          && request.auth.uid == uid
          && request.resource.data.keys().hasAll(['name', 'kcal'])
          && request.resource.data.kcal is number;
        allow update, delete: if request.auth != null && request.auth.uid == uid;
      }
    }

    // Weight entries – owner only
    match /users/{uid}/weight/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Public leaderboard – read only (admin writes via firebase-admin)
    match /leaderboard/{docId} {
      allow read: if request.auth != null;
      allow write: if false; // server-side only
    }
  }
}
```

---

## 8. Post-Deployment Checklist

### Functional Tests

- [ ] `https://nutritrack.it` loads without errors
- [ ] `https://www.nutritrack.it` redirects to apex domain
- [ ] Login with email/password works
- [ ] Login with Google OAuth works
- [ ] Dashboard loads with correct user data
- [ ] Adding a meal works and updates calorie ring
- [ ] Meal deletion works
- [ ] Nutrition search returns results
- [ ] Image upload works (via signed URL flow)
- [ ] PWA installs correctly on mobile

### Security Checks

- [ ] `curl -I https://nutritrack.it` shows all security headers
- [ ] Firebase API key is NOT visible in `/api/*` responses
- [ ] `FIREBASE_ADMIN_*` vars are NOT visible in client bundles
- [ ] Session cookie is HttpOnly (not accessible via `document.cookie`)
- [ ] HTTPS certificate is valid (`A+` on [SSL Labs](https://www.ssllabs.com/ssltest/))

### Performance

- [ ] Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices)
- [ ] Core Web Vitals pass: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Run: `vercel analytics` to enable Web Analytics

---

## 9. Rollback Plan

If the Vercel deployment has critical issues:

```bash
# Option A: Revert to previous Vercel deployment
vercel rollback

# Option B: Re-enable GitHub Pages (DNS change)
# 1. In GoDaddy DNS, change A record from 76.76.21.21 back to:
#    185.199.108.153
#    185.199.109.153
#    185.199.110.153
#    185.199.111.153
# 2. Re-enable GitHub Pages in repo settings
# TTL is 600s so propagation is fast
```

---

## 10. Troubleshooting

### `FIREBASE_ADMIN_PRIVATE_KEY` not working

Private keys in `.env` files need escaped newlines. Ensure each `\n` in the key is stored as a literal backslash-n:

```bash
# In .env.local – WRONG (multiline):
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQ...
-----END PRIVATE KEY-----"

# In .env.local – CORRECT (escaped):
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
```

In Vercel Dashboard, paste the raw key with actual newlines (Vercel handles escaping automatically).

### `auth/unauthorized-domain` on Google Login

Add your Vercel preview URL to Firebase Auth → Authorized Domains:
- `<project-name>.vercel.app`
- `<deployment-id>.vercel.app`

### Session cookie not persisting

Ensure `secure: true` is only set in production (the `/api/auth/session` route handles this automatically based on `NODE_ENV`).

For local testing use `http://localhost:3000` and ensure `NODE_ENV=development`.

### DNS not resolving after change

```bash
# Flush local DNS cache
# macOS:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows:
ipconfig /flushdns

# Linux:
sudo systemctl restart systemd-resolved
```

---

*Last updated: 2026 · NutriTrack v2.0 Vercel Migration*
