import admin from "firebase-admin";

const globalForFirebase = globalThis as unknown as {
  firebaseAdmin: admin.app.App | undefined;
};

function initFirebaseAdmin() {
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

export const messaging = admin.messaging();
