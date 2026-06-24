import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import FamilyDetailClient from "./family-detail-client";

export default async function FamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const family = await prisma.familySpace.findUnique({
    where: { id },
    include: {
      owner: { select: { email: true, name: true, createdAt: true } },
      children: {
        select: {
          id: true,
          name: true,
          username: true,
          balance: true,
          savingsBalance: true,
          deletedAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      subscription: {
        include: {
          plan: true,
          invoices: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { paymentLogs: { orderBy: { createdAt: "desc" }, take: 3 } },
          },
        },
      },
    },
  });

  if (!family) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/superadmin/families" className="text-gray-400 hover:text-white text-sm">
          ← Kembali
        </a>
        <span className="text-gray-600">/</span>
        <h1 className="text-xl font-bold text-white">{family.name}</h1>
        <span className="font-mono text-emerald-400 text-sm tracking-widest bg-gray-800 px-3 py-1 rounded-lg">
          {family.spaceCode}
        </span>
      </div>

      <FamilyDetailClient
        family={{
          id: family.id,
          name: family.name,
          spaceCode: family.spaceCode,
          ownerEmail: family.owner.email ?? "",
          ownerName: family.owner.name ?? "",
          ownerCreatedAt: family.owner.createdAt.toISOString(),
          children: family.children.map((c) => ({
            ...c,
            deletedAt: c.deletedAt?.toISOString() ?? null,
          })),
          subscription: family.subscription
            ? {
                id: family.subscription.id,
                status: family.subscription.status,
                cancelAtPeriodEnd: family.subscription.cancelAtPeriodEnd,
                currentPeriodStart: family.subscription.currentPeriodStart?.toISOString() ?? null,
                currentPeriodEnd: family.subscription.currentPeriodEnd?.toISOString() ?? null,
                planName: family.subscription.plan.name,
                planType: family.subscription.plan.type,
                invoices: family.subscription.invoices.map((inv) => ({
                  id: inv.id,
                  status: inv.status,
                  amount: inv.amount,
                  midtransOrderId: inv.midtransOrderId ?? "",
                  paidAt: inv.paidAt?.toISOString() ?? null,
                  createdAt: inv.createdAt.toISOString(),
                  paymentLogs: inv.paymentLogs.map((pl) => ({
                    id: pl.id,
                    event: pl.event,
                    createdAt: pl.createdAt.toISOString(),
                  })),
                })),
              }
            : null,
        }}
      />
    </div>
  );
}
