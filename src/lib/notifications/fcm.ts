/**
 * [5.1] Firebase Admin SDK — FCM Push Notifications
 * Init sekali (singleton via globalThis) dari env variables.
 *
 * PENTING: firebase-admin di-require() secara lazy di dalam fungsi (bukan static
 * import di atas) untuk mencegah gRPC native code dimuat saat build worker
 * Next.js berjalan — penyebab utama SIGSEGV di lingkungan cPanel.
 */

import { prisma } from "@/lib/prisma";

// Type-only import — tidak menghasilkan require() di output JS
import type * as AdminType from "firebase-admin";

type AdminApp = AdminType.app.App;

const globalForFirebase = globalThis as unknown as {
  firebaseApp: AdminApp | undefined;
};

/**
 * Lazy loader — require() hanya dipanggil saat benar-benar dibutuhkan.
 * Saat build phase (tidak ada Firebase env), initFirebase() return early
 * sebelum memanggil fungsi ini, sehingga native gRPC tidak pernah dimuat.
 */
function getAdmin(): typeof AdminType {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("firebase-admin") as typeof AdminType;
}

function initFirebase(): AdminApp | undefined {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[FCM] Firebase env tidak lengkap — push notifications dinonaktifkan");
    return undefined;
  }

  const admin = getAdmin();
  if (admin.apps.length > 0) return admin.apps[0]!;

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

export const firebaseApp = globalForFirebase.firebaseApp ?? initFirebase();
if (process.env.NODE_ENV !== "production") globalForFirebase.firebaseApp = firebaseApp;

/**
 * Kirim push notification ke multiple FCM tokens.
 * Token tidak valid dibersihkan dari DB secara otomatis.
 */
export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> {
  if (!firebaseApp || tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const admin = getAdmin();
  const messaging = admin.messaging(firebaseApp);

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data ?? {},
      android: {
        priority: "high",
        notification: { channelId: "misi-pintar-default" },
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error?.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await prisma.fcmToken.deleteMany({
        where: { token: { in: invalidTokens } },
      });
      console.log(`[FCM] Removed ${invalidTokens.length} invalid token(s)`);
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (err) {
    console.error("[FCM] sendEachForMulticast error:", err);
    return { successCount: 0, failureCount: tokens.length };
  }
}

/**
 * Ambil FCM tokens untuk seorang user (parent).
 */
export async function getUserFcmTokens(userId: string): Promise<string[]> {
  const rows = await prisma.fcmToken.findMany({
    where: { userId },
    select: { token: true },
  });
  return rows.map((r) => r.token);
}

/**
 * Ambil FCM tokens untuk seorang child.
 */
export async function getChildFcmTokens(childId: string): Promise<string[]> {
  const rows = await prisma.fcmToken.findMany({
    where: { childId },
    select: { token: true },
  });
  return rows.map((r) => r.token);
}
