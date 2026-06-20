import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// GET /api/sse — Server-Sent Events via Redis pub/sub
// Phase 5 implementation
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // TODO: Phase 5 — Subscribe to Redis channel and stream events
  const stream = new ReadableStream({
    start(controller) {
      const data = `data: {"type":"connected"}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
