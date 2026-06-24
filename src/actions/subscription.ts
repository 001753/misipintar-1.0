"use server";

// WAJIB: Subscription HANYA diaktifkan via Midtrans webhook (server-to-server)
// JANGAN aktifkan dari Snap.js onSuccess callback di client
// WAJIB: Signature Midtrans divalidasi di webhook handler sebelum apapun

import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import type { BillingCycle } from "@/lib/utils";

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
// Create Snap checkout token
// Subscription diaktifkan HANYA oleh webhook — bukan di sini
// ─────────────────────────────────────────────────────────────
export async function createCheckout(
  planId: string,
  billingCycle: BillingCycle
): Promise<
  | { success: true; snapToken: string; clientKey: string; orderId: string }
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

  // Pastikan Subscription record ada
  const subscription = await prisma.subscription.upsert({
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

  // Idempotency: kembalikan snapToken existing yang masih valid
  const existing = await prisma.invoice.findFirst({
    where: {
      subscriptionId: subscription.id,
      status: "PENDING",
      expiredAt: { gt: new Date() },
      amount,
      NOT: { snapToken: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing?.snapToken) {
    return {
      success: true,
      snapToken: existing.snapToken,
      clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
      orderId: existing.midtransOrderId ?? `INV-${existing.id}`,
    };
  }

  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const invoice = await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      amount,
      status: "PENDING",
      expiredAt,
    },
  });

  const orderId = `INV-${invoice.id}`;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  try {
    const snapResp = await snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: amount },
      customer_details: { first_name: user.name, email: user.email ?? undefined },
      item_details: [
        {
          id: `plan-${plan.type.toLowerCase()}-${billingCycle.toLowerCase()}`,
          price: amount,
          quantity: 1,
          name: `Misi Pintar ${plan.name} — ${billingCycle === "YEARLY" ? "Tahunan" : "Bulanan"}`,
        },
      ],
      expiry: { unit: "hours", duration: 24 },
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        snapToken: snapResp.token as string,
        midtransOrderId: orderId,
      },
    });

    return {
      success: true,
      snapToken: snapResp.token as string,
      clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
      orderId,
    };
  } catch (err: unknown) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "FAILED" },
    });
    return {
      error:
        err instanceof Error ? err.message : "Gagal membuat transaksi Midtrans.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Create QRIS charge via Midtrans Core API (server-side only)
// Subscription diaktifkan HANYA oleh webhook — bukan di sini
// ─────────────────────────────────────────────────────────────
export async function createQrisCheckout(
  planId: string,
  billingCycle: BillingCycle
): Promise<
  | { success: true; qrCodeUrl: string; qrString: string; orderId: string; expiredAt: string }
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

  const subscription = await prisma.subscription.upsert({
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

  // Idempotency: kembalikan QRIS yang masih valid (belum expired, masih PENDING)
  const existing = await prisma.invoice.findFirst({
    where: {
      subscriptionId: subscription.id,
      status: "PENDING",
      expiredAt: { gt: new Date() },
      amount,
      NOT: { qrisQrUrl: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing?.qrisQrUrl && existing.qrisQrString && existing.midtransOrderId) {
    return {
      success: true,
      qrCodeUrl: existing.qrisQrUrl,
      qrString: existing.qrisQrString,
      orderId: existing.midtransOrderId,
      expiredAt: existing.expiredAt.toISOString(),
    };
  }

  // QRIS berlaku 15 menit
  const expiredAt = new Date(Date.now() + 15 * 60 * 1000);

  const invoice = await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      amount,
      status: "PENDING",
      expiredAt,
    },
  });

  const orderId = `QRIS-${invoice.id}`;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  try {
    const { coreApi } = await import("@/lib/midtrans");

    const chargeResp = await coreApi.charge({
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: user.name,
        email: user.email ?? undefined,
      },
      item_details: [
        {
          id: `plan-${plan.type.toLowerCase()}-${billingCycle.toLowerCase()}`,
          price: amount,
          quantity: 1,
          name: `Misi Pintar ${plan.name} — ${billingCycle === "YEARLY" ? "Tahunan" : "Bulanan"}`,
        },
      ],
      qris: { acquirer: "gopay" },
    }) as Record<string, unknown>;

    // Midtrans returns QR URL under actions array
    let qrCodeUrl = "";
    let qrString = "";
    const actions = chargeResp.actions as Array<{ name: string; url: string }> | undefined;
    if (Array.isArray(actions)) {
      const qrAction = actions.find((a) => a.name === "generate-qr-code");
      if (qrAction) qrCodeUrl = qrAction.url;
    }
    if (chargeResp.qr_string) qrString = chargeResp.qr_string as string;
    if (!qrCodeUrl && chargeResp.qr_code_url) qrCodeUrl = chargeResp.qr_code_url as string;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        midtransOrderId: orderId,
        qrisQrUrl: qrCodeUrl,
        qrisQrString: qrString,
      },
    });

    return {
      success: true,
      qrCodeUrl,
      qrString,
      orderId,
      expiredAt: expiredAt.toISOString(),
    };
  } catch (err: unknown) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "FAILED" },
    });
    return {
      error:
        err instanceof Error ? err.message : "Gagal membuat transaksi QRIS.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Check QRIS invoice status from DB (called by polling)
// Tidak memanggil Midtrans API — status diperbarui oleh webhook
// ─────────────────────────────────────────────────────────────
export async function checkQrisStatus(
  orderId: string
): Promise<{ status: string; paidAt?: string } | { error: string }> {
  const session = await requireParentSession();
  if (!session) return { error: "Tidak terautentikasi." };

  const invoice = await prisma.invoice.findUnique({
    where: { midtransOrderId: orderId },
    select: { status: true, paidAt: true, subscriptionId: true },
  });

  if (!invoice) return { error: "Invoice tidak ditemukan." };

  return {
    status: invoice.status,
    paidAt: invoice.paidAt?.toISOString(),
  };
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
