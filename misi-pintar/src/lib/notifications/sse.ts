/**
 * [5.2] SSE Helper — Publish ke Redis channel keluarga.
 * Server Actions memanggil publishToFamily() untuk kirim event real-time.
 * JANGAN polling database — hanya Redis pub/sub.
 */

import { redis } from "@/lib/redis";

export type SseEvent = {
  type: string;
  payload: Record<string, unknown>;
};

/**
 * Publish event ke semua SSE clients yang subscribe ke keluarga ini.
 * Channel: sse:family:{familySpaceId}
 */
export async function publishToFamily(
  familySpaceId: string,
  event: SseEvent
): Promise<void> {
  if (!redis) return;
  try {
    await redis.publish(
      `sse:family:${familySpaceId}`,
      JSON.stringify(event)
    );
  } catch (err) {
    console.error("[SSE] publishToFamily error:", err);
  }
}

/**
 * Increment Redis counter badge notifikasi belum dibaca.
 * Key: notif:unread:{userId}
 */
export async function incrementUnreadBadge(userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.incr(`notif:unread:${userId}`);
  } catch {
    // non-fatal
  }
}

/**
 * Reset counter badge (saat user membuka halaman notifikasi).
 * Key: notif:unread:{userId}
 */
export async function resetUnreadBadge(userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(`notif:unread:${userId}`);
  } catch {
    // non-fatal
  }
}

/**
 * Baca jumlah notifikasi belum dibaca.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  if (!redis) return 0;
  try {
    const val = await redis.get(`notif:unread:${userId}`);
    return parseInt(val ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}
