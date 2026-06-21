/**
 * [5.2] SSE Endpoint — Real-time events via Redis pub/sub.
 * GET /api/sse
 * JANGAN polling database — hanya Redis SUBSCRIBE.
 *
 * Redis membutuhkan koneksi terpisah untuk mode SUBSCRIBE
 * (koneksi subscribe tidak bisa menjalankan command lain).
 */

import { auth } from "@/lib/auth/config";
import Redis from "ioredis";

const HEARTBEAT_INTERVAL_MS = 30_000;

function createSubscriberClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  return new Redis(url, {
    maxRetriesPerRequest: null,
    lazyConnect: false,
  });
}

export async function GET() {
  const session = await auth();
  if (!session || !session.user.familySpaceId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const familySpaceId = session.user.familySpaceId;
  const channel = `sse:family:${familySpaceId}`;

  const subscriber = createSubscriberClient();
  if (!subscriber) {
    // Redis tidak tersedia — kirim koneksi dummy agar client tidak loop reconnect
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

      // Kirim event "connected" segera
      send(JSON.stringify({ type: "connected", ts: Date.now() }));

      // Heartbeat setiap 30 detik untuk mencegah timeout
      heartbeatTimer = setInterval(() => {
        send(JSON.stringify({ type: "heartbeat", ts: Date.now() }));
      }, HEARTBEAT_INTERVAL_MS);

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
