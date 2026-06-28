"use server";

/**
 * Phase 6 — SuperAdmin Server Actions
 * SETIAP aksi sensitif WAJIB:
 * 1. Validasi role SUPER_ADMIN
 * 2. Ambil state `before` dari DB
 * 3. Lakukan perubahan
 * 4. Tulis ke AdminAuditLog dengan before/after/adminId/ipAddress
 * 5. Return { success }
 */

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { redis } from "@/lib/redis";
import type { ActionResult } from "@/types";

// ─── Helper: pastikan SUPER_ADMIN ────────────────────────

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  return { adminId: session.user.id, ip };
}

async function writeAuditLog(params: {
  adminId: string;
  ip: string;
  action: string;
  targetType: string;
  targetId: string;
  before: unknown;
  after: unknown;
}) {
  await prisma.adminAuditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      before: params.before as import("@prisma/client").Prisma.InputJsonValue ?? undefined,
      after: params.after as import("@prisma/client").Prisma.InputJsonValue ?? undefined,
      ipAddress: params.ip,
    },
  });
}

// Hapus cache plan dari Redis (plan limits cached oleh middleware atau halaman)
async function invalidatePlanCache(planId?: string) {
  if (!redis) return;
  try {
    const keys = planId
      ? [`plan:limits:${planId}`, "plans:all"]
      : ["plans:all"];
    await redis.del(...keys);
  } catch {
    // non-fatal
  }
}

// ─── [6.2] Plan Management ────────────────────────────────

export async function updatePlanPrice(
  planId: string,
  price: number,
  yearlyPrice: number
): Promise<ActionResult<null>> {
  const { adminId, ip } = await requireSuperAdmin();

  const before = await prisma.plan.findUnique({ where: { id: planId } });
  if (!before) return { success: false, error: "Plan tidak ditemukan." };

  const after = await prisma.plan.update({
    where: { id: planId },
    data: { price, yearlyPrice },
  });

  await writeAuditLog({
    adminId,
    ip,
    action: "UPDATE_PLAN_PRICE",
    targetType: "Plan",
    targetId: planId,
    before: { price: before.price, yearlyPrice: before.yearlyPrice },
    after: { price: after.price, yearlyPrice: after.yearlyPrice },
  });

  await invalidatePlanCache(planId);
  return { success: true, data: null };
}

export async function updatePlanLimits(
  planId: string,
  limits: Record<string, unknown>
): Promise<ActionResult<null>> {
  const { adminId, ip } = await requireSuperAdmin();

  const before = await prisma.plan.findUnique({ where: { id: planId } });
  if (!before) return { success: false, error: "Plan tidak ditemukan." };

  const after = await prisma.plan.update({
    where: { id: planId },
    data: { limits: limits as import("@prisma/client").Prisma.InputJsonValue },
  });

  await writeAuditLog({
    adminId,
    ip,
    action: "UPDATE_PLAN_LIMITS",
    targetType: "Plan",
    targetId: planId,
    before: { limits: before.limits },
    after: { limits: after.limits },
  });

  await invalidatePlanCache(planId);
  return { success: true, data: null };
}

export async function togglePlanActive(
  planId: string,
  isActive: boolean
): Promise<ActionResult<null>> {
  const { adminId, ip } = await requireSuperAdmin();

  const before = await prisma.plan.findUnique({ where: { id: planId } });
  if (!before) return { success: false, error: "Plan tidak ditemukan." };

  await prisma.plan.update({ where: { id: planId }, data: { isActive } });

  await writeAuditLog({
    adminId,
    ip,
    action: "TOGGLE_PLAN_ACTIVE",
    targetType: "Plan",
    targetId: planId,
    before: { isActive: before.isActive },
    after: { isActive },
  });

  await invalidatePlanCache(planId);
  return { success: true, data: null };
}

// ─── [6.3] Phase Control ─────────────────────────────────

export async function updatePhaseMode(
  mode: "FULL_FREE" | "FREEMIUM" | "PAID_ONLY"
): Promise<ActionResult<null>> {
  const { adminId, ip } = await requireSuperAdmin();

  const before = await prisma.appConfig.findUnique({
    where: { id: "global-config" },
  });

  // upsert: buat record jika belum ada (cPanel fresh DB belum di-seed)
  await prisma.appConfig.upsert({
    where:  { id: "global-config" },
    update: { phaseMode: mode },
    create: {
      id:        "global-config",
      phaseMode: mode,
      data: {
        interestRate: 2, taxRate: 5, maxTrialDays: 14,
        maintenanceMode: false,
        featureFlags: { pushNotifications: false, pdfReports: true, interestEngine: true, taxEngine: true },
      },
    },
  });

  await writeAuditLog({
    adminId,
    ip,
    action: "UPDATE_PHASE_MODE",
    targetType: "AppConfig",
    targetId: "global-config",
    before: { phaseMode: before?.phaseMode },
    after: { phaseMode: mode },
  });

  // Invalidate AppConfig cache
  if (redis) {
    await redis.del("appconfig:global").catch(() => {});
  }

  return { success: true, data: null };
}

// ─── [6.4] User / FamilySpace Management ─────────────────

export async function searchFamilySpaces(query: string) {
  await requireSuperAdmin();

  return prisma.familySpace.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { spaceCode: { contains: query.toUpperCase() } },
        { owner: { email: { contains: query, mode: "insensitive" } } },
      ],
    },
    include: {
      owner: { select: { email: true, name: true } },
      subscription: { include: { plan: { select: { name: true, type: true } } } },
      _count: { select: { children: true } },
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFamilySpaceDetail(familySpaceId: string) {
  await requireSuperAdmin();

  return prisma.familySpace.findUnique({
    where: { id: familySpaceId },
    include: {
      owner: { select: { email: true, name: true, createdAt: true } },
      children: { select: { id: true, name: true, username: true, balance: true, deletedAt: true } },
      subscription: {
        include: {
          plan: true,
          invoices: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      },
      _count: { select: { children: true } },
    },
  });
}

export async function forceUpgradeSubscription(
  familySpaceId: string,
  planType: "STARTER" | "PRO" | "EDUCATOR" | "SCHOOL"
): Promise<ActionResult<null>> {
  const { adminId, ip } = await requireSuperAdmin();

  const before = await prisma.subscription.findUnique({
    where: { familySpaceId },
    include: { plan: true },
  });

  const plan = await prisma.plan.findUnique({ where: { type: planType } });
  if (!plan) return { success: false, error: "Plan tidak ditemukan." };

  const statusMap: Record<string, string> = {
    STARTER: "FREE",
    PRO: "PRO",
    EDUCATOR: "EDUCATOR",
    SCHOOL: "SCHOOL",
  };
  const newStatus = statusMap[planType] ?? "FREE";

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const after = await prisma.subscription.upsert({
    where: { familySpaceId },
    update: {
      planId: plan.id,
      status: newStatus as never,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    create: {
      familySpaceId,
      planId: plan.id,
      status: newStatus as never,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  await writeAuditLog({
    adminId,
    ip,
    action: "FORCE_UPGRADE_SUB",
    targetType: "Subscription",
    targetId: after.id,
    before: { planType: before?.plan?.type, status: before?.status },
    after: { planType, status: newStatus, periodEnd },
  });

  return { success: true, data: null };
}

export async function forceExpireSubscription(
  familySpaceId: string
): Promise<ActionResult<null>> {
  const { adminId, ip } = await requireSuperAdmin();

  const before = await prisma.subscription.findUnique({
    where: { familySpaceId },
  });
  if (!before) return { success: false, error: "Subscription tidak ditemukan." };

  await prisma.subscription.update({
    where: { familySpaceId },
    data: { status: "EXPIRED" },
  });

  await writeAuditLog({
    adminId,
    ip,
    action: "FORCE_EXPIRE_SUB",
    targetType: "Subscription",
    targetId: before.id,
    before: { status: before.status },
    after: { status: "EXPIRED" },
  });

  return { success: true, data: null };
}

export async function suspendFamilySpace(
  familySpaceId: string,
  reason: string
): Promise<ActionResult<null>> {
  const { adminId, ip } = await requireSuperAdmin();

  const before = await prisma.familySpace.findUnique({
    where: { id: familySpaceId },
  });
  if (!before) return { success: false, error: "FamilySpace tidak ditemukan." };

  // Suspend dengan expire subscription
  const sub = await prisma.subscription.findUnique({ where: { familySpaceId } });
  if (sub) {
    await prisma.subscription.update({
      where: { familySpaceId },
      data: { status: "CANCELLED", cancelReason: `[SUSPENDED] ${reason}`, cancelAtPeriodEnd: false },
    });
  }

  await writeAuditLog({
    adminId,
    ip,
    action: "SUSPEND_FAMILY",
    targetType: "FamilySpace",
    targetId: familySpaceId,
    before: { name: before.name, subStatus: sub?.status },
    after: { status: "SUSPENDED", reason },
  });

  return { success: true, data: null };
}

// ─── [6.6] Manual Refund ─────────────────────────────────

export async function manualRefundInvoice(
  invoiceId: string
): Promise<ActionResult<null>> {
  const { adminId, ip } = await requireSuperAdmin();

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { success: false, error: "Invoice tidak ditemukan." };
  if (invoice.status !== "PAID") {
    return { success: false, error: "Hanya invoice PAID yang bisa direfund." };
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "REFUNDED" },
  });

  await writeAuditLog({
    adminId,
    ip,
    action: "MANUAL_REFUND",
    targetType: "Invoice",
    targetId: invoiceId,
    before: { status: invoice.status, amount: invoice.amount },
    after: { status: "REFUNDED" },
  });

  return { success: true, data: null };
}

// ─── [6.8] Manual Unblock Login ──────────────────────────

export async function manualUnblockLogin(
  identifier: string
): Promise<ActionResult<null>> {
  const { adminId, ip } = await requireSuperAdmin();

  // Hapus LoginAttempt dari DB
  const deleted = await prisma.loginAttempt.deleteMany({
    where: { identifier },
  });

  // Hapus Redis counter
  if (redis) {
    await redis.del(`login_attempts:${identifier}`).catch(() => {});
  }

  await writeAuditLog({
    adminId,
    ip,
    action: "MANUAL_UNBLOCK_LOGIN",
    targetType: "LoginAttempt",
    targetId: identifier,
    before: { count: deleted.count },
    after: { unblocked: true },
  });

  return { success: true, data: null };
}

// ─── Revenue Analytics Helper ─────────────────────────────

export async function getRevenueAnalytics() {
  await requireSuperAdmin();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeSubs,
    lastMonthExpired,
    planDistribution,
    monthlyRevenue,
  ] = await Promise.all([
    // Semua subscription aktif
    prisma.subscription.findMany({
      where: { status: { notIn: ["FREE", "EXPIRED", "CANCELLED"] } },
      include: { plan: { select: { name: true, type: true, price: true, yearlyPrice: true } } },
    }),
    // Churn bulan lalu
    prisma.subscription.count({
      where: {
        status: { in: ["EXPIRED", "CANCELLED"] },
        updatedAt: { gte: lastMonthStart, lt: lastMonthEnd },
      },
    }),
    // Distribusi per plan
    prisma.subscription.groupBy({
      by: ["planId"],
      where: { status: { notIn: ["FREE", "EXPIRED", "CANCELLED"] } },
      _count: { planId: true },
    }),
    // Revenue per bulan (12 bulan terakhir)
    prisma.invoice.groupBy({
      by: ["createdAt"],
      where: {
        status: "PAID",
        createdAt: {
          gte: new Date(now.getFullYear() - 1, now.getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  // MRR = sum(monthly_price) untuk semua active subscription
  const mrr = activeSubs.reduce((sum, sub) => {
    const price = sub.plan.price;
    return sum + price;
  }, 0);

  const arr = mrr * 12;

  // Churn rate = cancelled+expired bulan lalu / total bulan lalu
  const totalLastMonth = await prisma.subscription.count({
    where: { createdAt: { lt: lastMonthEnd } },
  });
  const churnRate =
    totalLastMonth > 0
      ? Math.round((lastMonthExpired / totalLastMonth) * 100 * 10) / 10
      : 0;

  // Plan distribution dengan nama plan
  const planIds = planDistribution.map((p) => p.planId);
  const plans = await prisma.plan.findMany({
    where: { id: { in: planIds } },
    select: { id: true, name: true, type: true },
  });
  const planMap = Object.fromEntries(plans.map((p) => [p.id, p]));
  const distribution = planDistribution.map((p) => ({
    planName: planMap[p.planId]?.name ?? p.planId,
    planType: planMap[p.planId]?.type ?? "",
    count: p._count.planId,
  }));

  // Group monthly revenue by month string
  const revenueByMonth: Record<string, number> = {};
  for (const row of monthlyRevenue) {
    const d = new Date(row.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + (row._sum.amount ?? 0);
  }

  // Buat 12 bulan terakhir sebagai series
  const monthLabels: string[] = [];
  const monthRevenue: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    monthLabels.push(label);
    monthRevenue.push(revenueByMonth[key] ?? 0);
  }

  return {
    mrr,
    arr,
    churnRate,
    totalActiveSubs: activeSubs.length,
    distribution,
    revenueChart: monthLabels.map((label, i) => ({
      label,
      revenue: monthRevenue[i],
    })),
  };
}
