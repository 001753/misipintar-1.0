import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { planTypeToSubStatus } from "@/lib/utils";
import {
  extractDokuAmount,
  extractDokuInvoiceNumber,
  resolveDokuPaymentMethod,
  extractDokuTransactionStatus,
  validateDokuNotificationSignature,
  validateDokuNotificationTimestamp,
} from "@/lib/doku";
import { sendPushNotification, getUserFcmTokens } from "@/lib/notifications/fcm";
import { publishToFamily, incrementUnreadBadge } from "@/lib/notifications/sse";
import { sendReceiptEmail } from "@/lib/send-receipt-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function header(req: NextRequest, name: string): string | null {
  return req.headers.get(name) ?? req.headers.get(name.toLowerCase());
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002"
  );
}

/**
 * POST /api/webhooks/doku
 *
 * Security model
 * ──────────────
 * 1. Signature validation  — HMAC-SHA256, verified with timing-safe compare.
 * 2. Timestamp validation  — rejects notifications older than 10 minutes.
 * 3. Replay protection     — fast-path exit if Request-Id already in PaymentLog.
 *    Fallback: PaymentLog.providerRequestId unique constraint inside the
 *    transaction catches the rare case where two parallel requests both pass
 *    the early check before either inserts the log row.
 * 4. Status-filtered query — only PENDING (non-expired) invoices are eligible
 *    for payment events; only PAID invoices are eligible for refund events.
 *    A late notification for an already-processed invoice returns 200 so DOKU
 *    stops retrying, but never mutates subscription state.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const requestTarget = new URL(req.url).pathname;
  const requestId = header(req, "Request-Id");
  const requestTimestamp = header(req, "Request-Timestamp");

  // ── 1. Signature validation ───────────────────────────────────────────────
  const validSignature = validateDokuNotificationSignature({
    body,
    clientId: header(req, "Client-Id"),
    requestId,
    requestTimestamp,
    signature: header(req, "Signature"),
    requestTarget,
  });
  if (!validSignature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
  }

  // ── 2. Timestamp validation ───────────────────────────────────────────────
  if (!validateDokuNotificationTimestamp(requestTimestamp)) {
    return NextResponse.json({ message: "Expired notification" }, { status: 403 });
  }

  const invoiceNumber = extractDokuInvoiceNumber(payload);
  if (!invoiceNumber) {
    return NextResponse.json({ message: "Missing invoice number" }, { status: 400 });
  }

  // Determine event class early — required for routing the invoice query and
  // for enabling replay protection before any state-mutating DB write.
  const earlyStatus = extractDokuTransactionStatus(payload);
  const isRefundEvent =
    earlyStatus === "REFUND" ||
    earlyStatus === "REFUNDED" ||
    earlyStatus === "PARTIAL_REFUND";

  // Anchor "now" once for the entire request so all comparisons are consistent.
  const now = new Date();

  // ── 3. Replay protection — fast-path before any state mutation ───────────
  // If Request-Id is already in PaymentLog, this is a DOKU retry of an event
  // we already fully processed. Return 200 immediately (so DOKU stops retrying)
  // without touching invoice or subscription state.
  // The in-transaction unique constraint on providerRequestId remains as a
  // fallback for the concurrent-arrival race condition.
  if (requestId) {
    const alreadySeen = await prisma.paymentLog.findFirst({
      where: { providerRequestId: requestId },
      select: { id: true },
    });
    if (alreadySeen) {
      return NextResponse.json({ message: "OK — duplicate notification" });
    }
  }

  // ── 4. Status-filtered invoice lookup ────────────────────────────────────
  // Non-refund events must only match a PENDING invoice that has not yet
  // expired. A late success/failure/expired notification for an invoice that is
  // already EXPIRED or FAILED must never change subscription state — returning
  // "unknown order" (200) stops DOKU retrying without granting access.
  // Refund events arrive after payment, so they must match a PAID invoice.
  const invoice = await prisma.invoice.findFirst({
    where: {
      paymentProvider: "DOKU",
      OR: [
        { providerInvoiceNumber: invoiceNumber },
        { midtransOrderId: invoiceNumber },
      ],
      ...(isRefundEvent
        ? { status: "PAID" }
        : { status: "PENDING", expiredAt: { gt: now } }),
    },
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
    // Unknown order (or ineligible status) is acknowledged to stop retries,
    // but subscription state is never changed.
    return NextResponse.json({ message: "OK — unknown order" });
  }

  // Re-use earlyStatus; extractDokuTransactionStatus has already been called.
  const status = earlyStatus ?? "UNKNOWN";
  const receivedAmount = extractDokuAmount(payload);
  const payMethod = resolveDokuPaymentMethod(payload);

  const isSuccess = status === "SUCCESS" || status === "SETTLEMENT";
  const isExpired = status === "EXPIRED" || status === "ORDER_EXPIRED";
  const isFailure = status === "FAILED" || status === "FAILURE" || status === "CANCEL";
  // isRefundEvent is already computed; alias for readability in branches below.
  const isRefund = isRefundEvent;

  // Amount validation is only meaningful for payment events (not refunds).
  if (!isRefund && (receivedAmount === null || receivedAmount !== invoice.amount)) {
    try {
      await prisma.paymentLog.create({
        data: {
          invoiceId: invoice.id,
          providerRequestId: requestId,
          event: `DOKU:${status}:AMOUNT_MISMATCH`,
          rawPayload: payload as import("@prisma/client").Prisma.InputJsonValue,
        },
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({ message: "OK — duplicate notification" });
      }
      throw error;
    }
    console.warn(`[DOKU webhook] Amount mismatch for ${invoiceNumber}`);
    return NextResponse.json({ message: "Amount mismatch" }, { status: 400 });
  }

  if (isSuccess) {
    const plan = invoice.subscription.plan;
    const familySpace = invoice.subscription.familySpace;
    const isYearly =
      invoice.billingCycle === "YEARLY" ||
      (invoice.billingCycle === null &&
        invoice.amount >= plan.yearlyPrice &&
        plan.yearlyPrice > 0);
    const periodEnd = new Date(
      now.getTime() +
        (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000
    );
    const newStatus = planTypeToSubStatus(plan.type);
    const notifTitle = "Langganan Aktif! ✅";
    const notifBody = `Langganan ${plan.name} keluarga ${familySpace.name} aktif hingga ${periodEnd.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`;

    let activated: boolean;
    try {
      activated = await prisma.$transaction(async (tx) => {
        // Request-Id is the provider's retry/replay identifier. Keeping this
        // insert in the same transaction as the state transition means a
        // failed transaction can safely be retried with the same notification.
        await tx.paymentLog.create({
          data: {
            invoiceId: invoice.id,
            providerRequestId: requestId,
            event: `DOKU:${status}`,
            rawPayload: payload as import("@prisma/client").Prisma.InputJsonValue,
          },
        });

        // Conditional update is the idempotency lock. In a parallel duplicate,
        // exactly one request gets count=1 and is allowed to activate access.
        // The invoice must still be PENDING and within its validity window;
        // a late success notification must never grant access.
        // (The findFirst above already enforces this; the updateMany re-checks
        // inside the transaction to cover the concurrent-arrival race.)
        const locked = await tx.invoice.updateMany({
          where: {
            id: invoice.id,
            status: "PENDING",
            expiredAt: { gt: now },
          },
          data: {
            status: "PAID",
            paidAt: now,
            paymentMethod: payMethod,
            providerTransactionId:
              header(req, "Transaction-Id") ?? requestId ?? undefined,
          },
        });
        if (locked.count !== 1) {
          // The invoice was changed between our findFirst and the lock
          // (e.g. concurrent request already processed it, or it expired
          // in the narrow window). Mark as expired if still pending but
          // now past its deadline; otherwise treat as already processed.
          await tx.invoice.updateMany({
            where: {
              id: invoice.id,
              status: "PENDING",
              expiredAt: { lte: now },
            },
            data: { status: "EXPIRED" },
          });
          return false;
        }

        await tx.subscription.update({
          where: { id: invoice.subscriptionId },
          data: {
            planId: plan.id,
            status: newStatus,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            cancelReason: null,
          },
        });
        await tx.notification.create({
          data: {
            familySpaceId: familySpace.id,
            userId: familySpace.ownerId,
            title: notifTitle,
            body: notifBody,
            type: "SUBSCRIPTION_ACTIVATED",
          },
        });
        return true;
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({ message: "OK — duplicate notification" });
      }
      throw error;
    }
    if (!activated) {
      return NextResponse.json({ message: "OK — already processed" });
    }

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
    } catch (error) {
      console.error("[DOKU webhook] Notification error (non-fatal):", error);
    }

    const owner = await prisma.user.findUnique({
      where: { id: familySpace.ownerId },
      select: { name: true, email: true, phone: true },
    });
    if (owner) {
      sendReceiptEmail({
        invoiceId: invoice.id,
        invoiceNumber,
        orderId: invoiceNumber,
        paymentProvider: invoice.paymentProvider,
        issuedAt: invoice.createdAt,
        paidAt: now,
        amount: invoice.amount,
        currency: plan.currency,
        paymentMethod: payMethod,
        billingCycle: isYearly ? "YEARLY" : "MONTHLY",
        plan: { name: plan.name, type: plan.type as string },
        customer: { name: owner.name, email: owner.email, phone: owner.phone },
        familySpaceName: familySpace.name,
        periodStart: now,
        periodEnd,
      }).catch((error) =>
        console.error("[DOKU webhook] Receipt email error (non-fatal):", error)
      );
    }
  } else if (isRefund) {
    // ── Refund: kembalikan subscription ke FREE, catat log ──────────────────
    const familySpace = invoice.subscription.familySpace;
    const planName = invoice.subscription.plan.name;
    const notifTitle = "Refund Diproses 💸";
    const notifBody = `Refund untuk langganan ${planName} keluarga ${familySpace.name} sudah diproses. Langganan kembali ke paket Gratis.`;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.paymentLog.create({
          data: {
            invoiceId: invoice.id,
            providerRequestId: requestId,
            event: `DOKU:${status}`,
            rawPayload: payload as import("@prisma/client").Prisma.InputJsonValue,
          },
        });

        // Hanya downgrade jika invoice saat ini masih PAID
        await tx.invoice.updateMany({
          where: { id: invoice.id, status: "PAID" },
          data: { status: "REFUNDED" },
        });

        // Kembalikan subscription ke FREE
        await tx.subscription.update({
          where: { id: invoice.subscriptionId },
          data: {
            status: "FREE",
            cancelAtPeriodEnd: false,
            cancelReason: "Refund dari DOKU",
          },
        });

        await tx.notification.create({
          data: {
            familySpaceId: familySpace.id,
            userId: familySpace.ownerId,
            title: notifTitle,
            body: notifBody,
            type: "SUBSCRIPTION_REFUNDED",
          },
        });
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({ message: "OK — duplicate notification" });
      }
      throw error;
    }

    // Notifikasi non-fatal (push + SSE)
    try {
      await incrementUnreadBadge(familySpace.ownerId);
      await publishToFamily(familySpace.id, {
        type: "subscription_refunded",
        payload: { planName },
      });
      const tokens = await getUserFcmTokens(familySpace.ownerId);
      if (tokens.length > 0) {
        await sendPushNotification(tokens, notifTitle, notifBody, {
          type: "SUBSCRIPTION_REFUNDED",
          planName,
        });
      }
    } catch (error) {
      console.error("[DOKU webhook] Refund notification error (non-fatal):", error);
    }
  } else if (isExpired || isFailure) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.paymentLog.create({
          data: {
            invoiceId: invoice.id,
            providerRequestId: requestId,
            event: `DOKU:${status}`,
            rawPayload: payload as import("@prisma/client").Prisma.InputJsonValue,
          },
        });
        await tx.invoice.updateMany({
          where: { id: invoice.id, status: { not: "PAID" } },
          data: { status: isExpired ? "EXPIRED" : "FAILED", paymentMethod: payMethod },
        });
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({ message: "OK — duplicate notification" });
      }
      throw error;
    }
  } else {
    try {
      await prisma.paymentLog.create({
        data: {
          invoiceId: invoice.id,
          providerRequestId: requestId,
          event: `DOKU:${status}`,
          rawPayload: payload as import("@prisma/client").Prisma.InputJsonValue,
        },
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({ message: "OK — duplicate notification" });
      }
      throw error;
    }
  }

  return NextResponse.json({ message: "OK" });
}
