/**
 * [5.2] SSE Endpoint — Real-time events via Redis pub/sub.
 * GET /api/sse
 *
 * ioredis di-require() secara lazy di dalam createSubscriberClient() — BUKAN
 * static import di atas — karena static import menyebabkan ioredis (beserta
 * @msgpackr-extract native addon) termuat saat build worker → SIGABRT.
 */

import { auth } from "@/lib/auth/config";

const HEARTBEAT_INTERVAL_MS = 30_000;
// Batas durasi koneksi SSE per client — cegah akumulasi Entry Process di cPanel.
// EventSource browser akan otomatis reconnect setelah koneksi ditutup server.
const MAX_CONNECTION_MS = 5 * 60 * 1000; // 5 menit

function createSubscriberClient() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (process.env.NEXT_BUILD === "1") return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IRedis = (require("ioredis") as { default: typeof import("ioredis").default }).default;
    return new IRedis(url, {
      maxRetriesPerRequest: null,
      lazyConnect: false,
    });
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session || !session.user.familySpaceId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const familySpaceId = session.user.familySpaceId;
  const channel = `sse:family:${familySpaceId}`;

  const subscriber = createSubscriberClient();
  if (!subscriber) {
    return new Response('data: {"type":"no-redis"}\n\n', {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const encoder = new TextEncoder();
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let maxLifetimeTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: string) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Client sudah disconnect
        }
      }

      function closeStream() {
        if (closed) return;
        closed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (maxLifetimeTimer) clearTimeout(maxLifetimeTimer);
        subscriber.unsubscribe(channel).catch(() => {});
        subscriber.quit().catch(() => {});
        try { controller.close(); } catch { /* sudah closed */ }
      }

      send(JSON.stringify({ type: "connected", ts: Date.now() }));

      heartbeatTimer = setInterval(() => {
        send(JSON.stringify({ type: "heartbeat", ts: Date.now() }));
      }, HEARTBEAT_INTERVAL_MS);

      // Tutup koneksi secara paksa setelah MAX_CONNECTION_MS.
      // Browser EventSource akan otomatis reconnect — mencegah akumulasi
      // Entry Process di cPanel akibat tab idle yang tidak pernah disconnect.
      maxLifetimeTimer = setTimeout(() => {
        send(JSON.stringify({ type: "reconnect", ts: Date.now() }));
        closeStream();
      }, MAX_CONNECTION_MS);

      await subscriber.subscribe(channel);

      subscriber.on("message", (_ch: string, message: string) => {
        send(message);
      });

      subscriber.on("error", (err: Error) => {
        console.error("[SSE] Redis subscriber error:", err.message);
      });
    },

    cancel() {
      closed = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (maxLifetimeTimer) clearTimeout(maxLifetimeTimer);
      subscriber.unsubscribe(channel).catch(() => {});
      subscriber.quit().catch(() => {});
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
