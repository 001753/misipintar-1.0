/**
 * Firebase Admin — singleton wrapper.
 *
 * PENTING: firebase-admin di-require() secara lazy di dalam fungsi (bukan static
 * import di atas) untuk mencegah gRPC native code dimuat saat build worker
 * Next.js berjalan — penyebab utama SIGSEGV di lingkungan cPanel.
 */

import type * as AdminType from "firebase-admin";

type AdminApp = AdminType.app.App;

const globalForFirebase = globalThis as unknown as {
  firebaseAdmin: AdminApp | undefined;
  firebaseMessaging: AdminType.messaging.Messaging | undefined;
};

function getAdmin(): typeof AdminType {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("firebase-admin") as typeof AdminType;
}

function initFirebaseAdmin(): AdminApp | undefined {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.warn("[firebase] Firebase credentials not set — push notifications disabled");
    return undefined;
  }

  const admin = getAdmin();
  if (admin.apps.length > 0) return admin.apps[0]!;

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const firebaseAdmin =
  globalForFirebase.firebaseAdmin ?? initFirebaseAdmin();

if (process.env.NODE_ENV !== "production")
  globalForFirebase.firebaseAdmin = firebaseAdmin;

export const messaging = firebaseAdmin ? getAdmin().messaging() : undefined;
