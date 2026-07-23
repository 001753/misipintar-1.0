import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { planTypeToSubStatus } from "@/lib/utils";
import {
  extractDokuAmount,
  extractDokuInvoiceNumber,
  resolveDokuPaymentMethod,
  extractDokuTransactionStatus,
  validateDokuNotificationSignature,
} from "@/lib/doku";
import { sendPushNotification, getUserFcmTokens } from "@/lib/notifications/fcm";
import { publishToFamily, incrementUnreadBadge } from "@/lib/notifications/sse";
import { sendReceiptEmail } from "@/lib/send-receipt-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function header(req: NextRequest, name: string): string | null {
  return req.headers.get(name) ?? req.headers.get(name.toLowerCase());
}

/**
 * POST /api/webhooks/doku
 *
 * DOKU may retry notifications. Signature and amount are checked before
 * changing any subscription state; a PAID invoice is an idempotent no-op.
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
  const validSignature = validateDokuNotificationSignature({
    body,
    clientId: header(req, "Client-Id"),
    requestId: header(req, "Request-Id"),
    requestTimestamp: header(req, "Request-Timestamp"),
    signature: header(req, "Signature"),
    requestTarget,
  });
  if (!validSignature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
  }

  const invoiceNumber = extractDokuInvoiceNumber(payload);
  if (!invoiceNumber) {
    return NextResponse.json({ message: "Missing invoice number" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      paymentProvider: "DOKU",
      OR: [
        { providerInvoiceNumber: invoiceNumber },
        { midtransOrderId: invoiceNumber },
      ],
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
    // Unknown order is acknowledged to stop retries, but is never activated.
    return NextResponse.json({ message: "OK — unknown order" });
  }

  const requestId = header(req, "Request-Id");
  const status = extractDokuTransactionStatus(payload) ?? "UNKNOWN";
  const receivedAmount = extractDokuAmount(payload);
  const payMethod = resolveDokuPaymentMethod(payload);

  await prisma.paymentLog.create({
    data: {
      invoiceId: invoice.id,
      event: `DOKU:${status}`,
      rawPayload: payload as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  if (invoice.status === "PAID") {
    return NextResponse.json({ message: "OK — already processed" });
  }

  if (receivedAmount === null || receivedAmount !== invoice.amount) {
    console.warn(`[DOKU webhook] Amount mismatch for ${invoiceNumber}`);
    return NextResponse.json({ message: "Amount mismatch" }, { status: 400 });
  }

  const isSuccess = status === "SUCCESS" || status === "SETTLEMENT";
  const isExpired = status === "EXPIRED" || status === "ORDER_EXPIRED";
  const isFailure = status === "FAILED" || status === "FAILURE" || status === "CANCEL";

  if (isSuccess) {
    const plan = invoice.subscription.plan;
    const familySpace = invoice.subscription.familySpace;
    const now = new Date();
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

    const activated = await prisma.$transaction(async (tx) => {
      // Conditional update is the idempotency lock. In a parallel duplicate,
      // exactly one request gets count=1 and is allowed to activate access.
      const locked = await tx.invoice.updateMany({
        where: { id: invoice.id, status: { not: "PAID" } },
        data: {
          status: "PAID",
          paidAt: now,
          paymentMethod: payMethod,
          providerTransactionId:
            header(req, "Transaction-Id") ?? requestId ?? undefined,
        },
      });
      if (locked.count !== 1) return false;

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
  } else if (isExpired || isFailure) {
    await prisma.invoice.updateMany({
      where: { id: invoice.id, status: { not: "PAID" } },
      data: { status: isExpired ? "EXPIRED" : "FAILED", paymentMethod: payMethod },
    });
  }

  return NextResponse.json({ message: "OK" });
}