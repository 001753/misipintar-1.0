import { NextRequest, NextResponse } from "next/server";
import { validateMidtransSignature } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";

// POST /api/webhooks/midtrans
// WAJIB: Validasi signature SHA-512 server-to-server
// WAJIB: Idempotency via Subscription.invoiceId UNIQUE constraint
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;

  const isValid = validateMidtransSignature(
    order_id,
    status_code,
    gross_amount,
    signature_key
  );

  if (!isValid) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
  }

  // Phase 4: handle payment states
  // TODO: Implement full webhook handler in Phase 4

  return NextResponse.json({ message: "OK" });
}
