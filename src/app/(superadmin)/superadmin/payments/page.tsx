export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import PaymentsClient from "./payments-client";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10));
  const PAGE_SIZE = 50;

  const where = status && status !== "ALL"
    ? { status: status as "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "REFUNDED" }
    : {};

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        subscription: {
          include: {
            familySpace: { select: { name: true } },
            plan: { select: { name: true } },
          },
        },
        paymentLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.invoice.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Operasi Pembayaran</h1>
        <p className="text-gray-400 mt-1">Daftar invoice dan manajemen refund</p>
      </div>

      <PaymentsClient
        invoices={invoices.map((inv) => ({
          id: inv.id,
          status: inv.status,
          amount: inv.amount,
          midtransOrderId: inv.midtransOrderId ?? "",
          paymentMethod: inv.paymentMethod ?? null,
          paidAt: inv.paidAt?.toISOString() ?? null,
          expiredAt: inv.expiredAt.toISOString(),
          createdAt: inv.createdAt.toISOString(),
          familyName: inv.subscription.familySpace.name,
          planName: inv.subscription.plan.name,
          lastEvent: inv.paymentLogs[0]?.event ?? null,
        }))}
        total={total}
        page={pageNum}
        pageSize={PAGE_SIZE}
        currentStatus={status ?? "ALL"}
      />
    </div>
  );
}
