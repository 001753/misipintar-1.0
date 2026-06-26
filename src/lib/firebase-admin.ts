/**
 * Firebase Admin — singleton wrapper.
 * Lazy init, build-safe: tidak di-load saat NEXT_BUILD=1
 * atau saat env vars Firebase tidak tersedia.
 */

let _app: any = null;
let _messaging: any = null;
let _initialized = false;

async function init() {
  if (_initialized) return;
  _initialized = true;

  if (process.env.NEXT_BUILD === '1') return;
  if (typeof window !== 'undefined') return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[firebase] Firebase credentials not set — push notifications disabled');
    return;
  }

  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getMessaging } = await import('firebase-admin/messaging');

    _app = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        })
      : getApps()[0];

    _messaging = getMessaging(_app);
  } catch (err) {
    console.error('[firebase] Gagal init firebase-admin:', err);
  }
}

export async function getFirebaseAdmin() {
  await init();
  return _app;
}

export async function getFirebaseMessaging() {
  await init();
  return _messaging;
}

// Backward compat exports (sync — may be null if not yet initialized)
export const firebaseAdmin = null;
export const messaging = null;
