/**
 * POST /api/storage/sign
 *
 * Server-side signed URL generation for Firebase Storage uploads.
 *
 * Security model:
 *   1. Client authenticates with Firebase Auth (gets ID token)
 *   2. Client requests a signed upload URL from this endpoint
 *   3. This server verifies the ID token, generates a short-lived signed URL
 *      using firebase-admin (never exposes service account credentials)
 *   4. Client uploads directly to Firebase Storage using the signed URL
 *   5. Client calls /api/storage/confirm to record the final URL in Firestore
 *
 * This flow keeps all GCS service account credentials server-side and
 * ensures users can only upload to their own storage path.
 *
 * Request body:
 *   { filename: string, contentType: string, context: 'avatar' | 'meal' | 'progress' }
 *
 * Response:
 *   { signedUrl: string, storagePath: string, expiresAt: string }
 */

import { NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin.config';
import { verifyIdToken } from '@/lib/repositories/userRepository';

// Allowed file contexts and their storage path prefixes
const CONTEXT_PATHS = {
  avatar:   'avatars',
  meal:     'meals',
  progress: 'progress',
};

// Allowed MIME types per context
const ALLOWED_TYPES = {
  avatar:   ['image/jpeg', 'image/png', 'image/webp'],
  meal:     ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  progress: ['image/jpeg', 'image/png', 'image/webp'],
};

// Maximum file sizes in bytes
const MAX_SIZES = {
  avatar:   2 * 1024 * 1024,   // 2 MB
  meal:     8 * 1024 * 1024,   // 8 MB
  progress: 5 * 1024 * 1024,   // 5 MB
};

export async function POST(request) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const authorization = request.headers.get('Authorization') ?? '';
  const idToken = authorization.replace('Bearer ', '').trim();

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let uid;
  try {
    const decoded = await verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
  }

  // ── Validate body ─────────────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { filename, contentType, context = 'meal', fileSize } = body;

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: '"filename" is required.' }, { status: 400 });
  }
  if (!contentType || typeof contentType !== 'string') {
    return NextResponse.json({ error: '"contentType" is required.' }, { status: 400 });
  }
  if (!CONTEXT_PATHS[context]) {
    return NextResponse.json(
      { error: `"context" must be one of: ${Object.keys(CONTEXT_PATHS).join(', ')}` },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES[context].includes(contentType)) {
    return NextResponse.json(
      { error: `Content type "${contentType}" not allowed for context "${context}".` },
      { status: 415 }
    );
  }
  if (fileSize && fileSize > MAX_SIZES[context]) {
    return NextResponse.json(
      { error: `File exceeds maximum size of ${MAX_SIZES[context] / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  // ── Sanitise filename ─────────────────────────────────────────────────
  const ext = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'jpg';
  const timestamp = Date.now();
  const storagePath = `${CONTEXT_PATHS[context]}/${uid}/${timestamp}.${ext}`;

  // ── Generate signed URL ───────────────────────────────────────────────
  try {
    const bucket = getAdminStorage().bucket();
    const file = bucket.file(storagePath);

    const expiresInMs = 15 * 60 * 1000; // 15 minutes
    const expiresAt = new Date(Date.now() + expiresInMs);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAt,
      contentType,
    });

    return NextResponse.json({
      signedUrl,
      storagePath,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('[/api/storage/sign]', err);
    return NextResponse.json(
      { error: 'Failed to generate upload URL. Please try again.' },
      { status: 500 }
    );
  }
}
