"use server";

// Subscription hanya diaktifkan oleh webhook server-to-server.

import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { BillingCycle } from "@/lib/utils";
import crypto from "node:crypto";
import {
  DOKU_CHECKOUT_PAYMENT_METHODS,
  extractDokuPaymentUrl,
  getDokuCheckoutUrl,
  getDokuPublicBaseUrl,
  buildDokuRequestHeaders,
} from "@/lib/doku";

export type { BillingCycle } from "@/lib/utils";

async function requireParentSession() {
  const session = await auth();
  if (!session || session.user.role !== "PARENT") redirect("/login");
  if (!session.user.familySpaceId) redirect("/login");
  return session;
}

// ─────────────────────────────────────────────────────────────
// Get current subscription + all plans
// ─────────────────────────────────────────────────────────────
export async function getSubscriptionInfo() {
  const session = await requireParentSession();
  const familySpaceId = session.user.familySpaceId!;

  const [subscription, plans, user] = await Promise.all([
    prisma.subscription.findUnique({
      where: { familySpaceId },
      include: {
        plan: true,
        invoices: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } }),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
  ]);

  return { subscription, plans, user };
}

// ─────────────────────────────────────────────────────────────
// Create DOKU Checkout URL.
// Subscription diaktifkan HANYA oleh webhook — bukan di sini
// ─────────────────────────────────────────────────────────────
export async function createCheckout(
  planId: string,
  billingCycle: BillingCycle
): Promise<
  | { success: true; paymentUrl: string; orderId: string }
  | { error: string }
> {
  const session = await requireParentSession();
  const familySpaceId = session.user.familySpaceId!;

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return { error: "Plan tidak ditemukan." };
  if (plan.price === 0 && plan.yearlyPrice === 0)
    return { error: "Plan ini gratis, tidak perlu pembayaran." };

  const amount = billingCycle === "YEARLY" ? plan.yearlyPrice : plan.price;
  if (amount <= 0) return { error: "Harga plan tidak valid." };

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  const checkoutKey = `DOKU:${familySpaceId}:${plan.id}:${billingCycle}:${amount}`;
  const lockKey = `DOKU_CHECKOUT:${familySpaceId}`;

  // The lock spans invoice reservation and the provider request. This is
  // intentional: a second click must wait until the first request either
  // has a payment URL to reuse or has failed and released its reservation.
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
      `;

      const subscription = await tx.subscription.upsert({
        where: { familySpaceId },
        create: {
          familySpaceId,
          planId: plan.id,
          status: "FREE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {},
      });

      // Release a stale pending reservation before creating a replacement.
      // This keeps the partial unique index usable after the 24-hour expiry.
      await tx.invoice.updateMany({
        where: {
          checkoutKey,
          status: "PENDING",
          expiredAt: { lte: new Date() },
        },
        data: { status: "EXPIRED" },
      });

      const existing = await tx.invoice.findFirst({
        where: {
          checkoutKey,
          subscriptionId: subscription.id,
          status: "PENDING",
          expiredAt: { gt: new Date() },
          paymentProvider: "DOKU",
        },
        orderBy: { createdAt: "desc" },
      });

      if (existing?.paymentUrl && existing.providerInvoiceNumber) {
        return {
          success: true as const,
          paymentUrl: existing.paymentUrl,
          orderId: existing.providerInvoiceNumber,
        };
      }

      if (existing) {
        return {
          error:
            "Checkout sedang diproses. Tunggu beberapa detik lalu coba lagi.",
        };
      }

      const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const invoice = await tx.invoice.create({
        data: {
          subscriptionId: subscription.id,
          amount,
          status: "PENDING",
          expiredAt,
          billingCycle,
          checkoutKey,
          paymentProvider: "DOKU",
        },
      });

      // DOKU invoice number tidak perlu memuat UUID dengan tanda hubung.
      const orderId = `DOKU-${invoice.id.replace(/-/g, "").slice(0, 24)}`;

      try {
        const requestId = crypto.randomUUID();
        const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
        const appUrl = getDokuPublicBaseUrl();
        const requestBody = {
          order: {
            amount,
            invoice_number: orderId,
            currency: "IDR",
            callback_url: `${appUrl}/dashboard/billing?payment=doku`,
            callback_url_cancel: `${appUrl}/dashboard/billing?payment=cancelled`,
            line_items: [
              {
                id: `plan-${plan.type.toLowerCase()}-${billingCycle.toLowerCase()}`,
                name: `Misi Pintar ${plan.name} — ${billingCycle === "YEARLY" ? "Tahunan" : "Bulanan"}`,
                quantity: 1,
                price: amount,
              },
            ],
          },
          payment: {
            payment_method_types: [...DOKU_CHECKOUT_PAYMENT_METHODS],
            payment_due_date: 1440,
          },
          customer: {
            id: session.user.id,
            name: user.name,
            phone: user.phone ?? undefined,
            email: user.email ?? undefined,
            country: "ID",
          },
          additional_info: {
            override_notification_url: `${appUrl}/api/webhooks/doku`,
          },
        };
        const body = JSON.stringify(requestBody);
        const response = await fetch(getDokuCheckoutUrl(), {
          method: "POST",
          headers: buildDokuRequestHeaders({
            body,
            requestId,
            requestTimestamp,
          }),
          body,
          cache: "no-store",
        });
        const responseText = await response.text();
        let responsePayload: unknown;
        try {
          responsePayload = JSON.parse(responseText);
        } catch {
          responsePayload = null;
        }
        if (!response.ok) {
          const message =
            responsePayload &&
            typeof responsePayload === "object" &&
            "message" in responsePayload &&
            typeof responsePayload.message === "string"
              ? responsePayload.message
              : `DOKU mengembalikan HTTP ${response.status}.`;
          throw new Error(message);
        }
        const paymentUrl = extractDokuPaymentUrl(responsePayload);
        if (!paymentUrl) throw new Error("DOKU tidak mengembalikan payment URL.");
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            providerInvoiceNumber: orderId,
            providerRequestId: requestId,
            paymentUrl,
          },
        });

        return {
          success: true as const,
          paymentUrl,
          orderId,
        };
      } catch (err: unknown) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: "FAILED" },
        });
        return {
          error:
            err instanceof Error ? err.message : "Gagal membuat transaksi DOKU.",
        };
      }
    },
    { maxWait: 10_000, timeout: 30_000 }
  );
}

// QRIS lama dipertahankan hanya sebagai data historis. Semua action pembuatan
// QRIS baru menolak agar tidak ada jalur checkout tersembunyi yang aktif.
export async function createQrisCheckout(
  planId: string,
  billingCycle: BillingCycle
): Promise<
  | { success: true; qrCodeUrl: string; qrString: string; orderId: string; expiredAt: string }
  | { error: string }
> {
  void planId;
  void billingCycle;
  return { error: "Pembayaran QRIS sudah dinonaktifkan." };
}

// ─────────────────────────────────────────────────────────────
// Check QRIS invoice status from DB (called by polling)
// Tidak memanggil Midtrans API — status diperbarui oleh webhook
// ─────────────────────────────────────────────────────────────
export async function checkQrisStatus(
  orderId: string
): Promise<{ status: string; paidAt?: string } | { error: string }> {
  void orderId;
  return { error: "Pembayaran QRIS sudah dinonaktifkan." };
}

// ─────────────────────────────────────────────────────────────
// Cancel subscription — efektif di akhir periode
// ─────────────────────────────────────────────────────────────
export async function cancelSubscription(
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireParentSession();
  const familySpaceId = session.user.familySpaceId!;

  const sub = await prisma.subscription.findUnique({
    where: { familySpaceId },
    select: { id: true, status: true },
  });
  if (!sub) return { success: false, error: "Subscription tidak ditemukan." };
  if (sub.status === "FREE" || sub.status === "CANCELLED")
    return { success: false, error: "Tidak ada subscription aktif yang bisa dibatalkan." };

  await prisma.subscription.update({
    where: { familySpaceId },
    data: {
      cancelAtPeriodEnd: true,
      cancelReason: reason ?? "Dibatalkan oleh pengguna",
    },
  });

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Resume — batalkan jadwal cancel
// ─────────────────────────────────────────────────────────────
export async function resumeSubscription(): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await requireParentSession();
  const familySpaceId = session.user.familySpaceId!;

  await prisma.subscription.update({
    where: { familySpaceId },
    data: { cancelAtPeriodEnd: false, cancelReason: null },
  });

  return { success: true };
}
