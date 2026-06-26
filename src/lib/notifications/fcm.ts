/**
 * [5.1] Firebase Admin SDK — FCM Push Notifications
 * Lazy init, build-safe: firebase-admin tidak di-load saat NEXT_BUILD=1
 * atau saat env vars Firebase tidak tersedia.
 */

import { prisma } from "@/lib/prisma";

let _messaging: import('firebase-admin/messaging').Messaging | null = null;

async function getMessaging() {
  if (process.env.NEXT_BUILD === '1') return null;
  if (typeof window !== 'undefined') return null;
  if (_messaging) return _messaging;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.log('[FCM] Firebase env tidak lengkap — push notifications dinonaktifkan');
    return null;
  }

  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getMessaging: _getMessaging } = await import('firebase-admin/messaging');

    const app = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        })
      : getApps()[0];

    _messaging = _getMessaging(app);
    return _messaging;
  } catch (err) {
    console.error('[FCM] Gagal init firebase-admin:', err);
    return null;
  }
}

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
  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const messaging = await getMessaging();
  if (!messaging) return { successCount: 0, failureCount: 0 };

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data ?? {},
      android: {
        priority: 'high',
        notification: { channelId: 'misi-pintar-default' },
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
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
    console.error('[FCM] sendEachForMulticast error:', err);
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
