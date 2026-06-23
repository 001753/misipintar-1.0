import { NextRequest, NextResponse } from "next/server";
import { validateMidtransSignature } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";
import { planTypeToSubStatus } from "@/actions/subscription";
import { sendPushNotification, getUserFcmTokens } from "@/lib/notifications/fcm";
import { publishToFamily, incrementUnreadBadge } from "@/lib/notifications/sse";

// POST /api/webhooks/midtrans
// WAJIB: Validasi signature SHA-512 sebelum apapun — tolak jika tidak valid
// WAJIB: Idempotency — skip jika invoice sudah PAID
// WAJIB: Semua update DB dalam satu $transaction
export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    payment_type,
    fraud_status,
  } = body;

  // 1. Validasi signature SHA-512
  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const isValid = validateMidtransSignature(
    order_id,
    status_code,
    gross_amount,
    signature_key
  );

  if (!isValid) {
    console.warn(`[Webhook] Invalid signature for order ${order_id}`);
    return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
  }

  // 2. Cari Invoice by midtransOrderId
  const invoice = await prisma.invoice.findUnique({
    where: { midtransOrderId: order_id },
    include: {
      subscription: {
        include: {
          plan: true,
          familySpace: { select: { id: true, name: true, ownerId: true } },
        },
      },
    },
  });

  if (!invoice) {
    console.warn(`[Webhook] Unknown order_id: ${order_id}`);
    return NextResponse.json({ message: "OK — unknown order" });
  }

  // 3. Catat PaymentLog (idempotent — selalu simpan setiap notifikasi)
  await prisma.paymentLog.create({
    data: {
      invoiceId: invoice.id,
      event: transaction_status ?? "unknown",
      rawPayload: body as unknown as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  // 4. Idempotency: invoice sudah PAID → tidak perlu proses ulang
  if (invoice.status === "PAID") {
    return NextResponse.json({ message: "OK — already processed" });
  }

  // 5. Tentukan PayMethod dari payment_type
  function resolvePayMethod(pt: string): string {
    if (pt === "qris") return "QRIS";
    if (pt === "gopay") return "GOPAY";
    if (pt === "shopeepay") return "SHOPEEPAY";
    if (pt === "bank_transfer" || pt === "permata" || pt === "bca_va") return "BANK_TRANSFER";
    if (pt === "credit_card") return "CREDIT_CARD";
    if (pt?.includes("_va") || pt === "echannel") return "VA";
    return "BANK_TRANSFER";
  }

  const payMethod = payment_type ? resolvePayMethod(payment_type) : undefined;

  // 6. Proses berdasarkan transaction_status
  const isSuccess =
    transaction_status === "settlement" ||
    (transaction_status === "capture" && fraud_status === "accept");

  const isFailure =
    transaction_status === "deny" ||
    transaction_status === "cancel" ||
    transaction_status === "expire" ||
    transaction_status === "failure";

  const isRefund =
    transaction_status === "refund" || transaction_status === "partial_refund";

  if (isSuccess) {
    const plan = invoice.subscription.plan;
    const familySpace = invoice.subscription.familySpace;
    const isYearly = invoice.amount >= plan.yearlyPrice && plan.yearlyPrice > 0;
    const durationMs = isYearly
      ? 365 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;

    const now = new Date();
    const periodEnd = new Date(now.getTime() + durationMs);
    const newStatus = planTypeToSubStatus(plan.type);

    const notifTitle = "Langganan Aktif! ✅";
    const notifBody = `Langganan ${plan.name} keluarga ${familySpace.name} aktif hingga ${periodEnd.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`;

    await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paidAt: now,
          paymentMethod: payMethod as never,
        },
      }),
      prisma.subscription.update({
        where: { id: invoice.subscriptionId },
        data: {
          planId: plan.id,
          status: newStatus as never,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          cancelReason: null,
        },
      }),
      // [5.3] Notifikasi in-app ke parent
      prisma.notification.create({
        data: {
          familySpaceId: familySpace.id,
          userId: familySpace.ownerId,
          title: notifTitle,
          body: notifBody,
          type: "SUBSCRIPTION_ACTIVATED",
        },
      }),
    ]);

    // Data finansial sudah tersimpan di PaymentLog — tidak perlu console.log

    // [5.3] FCM + SSE setelah transaksi — non-fatal
    try {
      await incrementUnreadBadge(familySpace.ownerId);

      await publishToFamily(familySpace.id, {
        type: "subscription_activated",
        payload: { planName: plan.name, periodEnd: periodEnd.toISOString() },
      });

      const tokens = await getUserFcmTokens(familySpace.ownerId);
      if (tokens.length > 0) {
        await sendPushNotification(tokens, notifTitle, notifBody, {
          type: "SUBSCRIPTION_ACTIVATED",
          planName: plan.name,
        });
      }
    } catch (err) {
      console.error("[Webhook] Post-payment notification error (non-fatal):", err);
    }
  } else if (isFailure) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: transaction_status === "expire" ? "EXPIRED" : "FAILED",
        paymentMethod: payMethod as never,
      },
    });

    // Status FAILED/EXPIRED tersimpan di PaymentLog
  } else if (isRefund) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "REFUNDED" },
    });

    // Status REFUNDED tersimpan di PaymentLog
  }

  return NextResponse.json({ message: "OK" });
}
