export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import AuditLogClient from "./audit-client";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const { action, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10));
  const PAGE_SIZE = 50;

  const where = action && action !== "ALL" ? { action } : {};

  const [logs, total, distinctActions] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-gray-400 mt-1">
          Catatan permanen semua aksi SuperAdmin. Tidak ada tombol hapus/edit — audit log bersifat
          immutable.
        </p>
      </div>

      <AuditLogClient
        logs={logs.map((l) => ({
          id: l.id,
          action: l.action,
          targetType: l.targetType,
          targetId: l.targetId,
          before: l.before,
          after: l.after,
          ipAddress: l.ipAddress ?? "-",
          createdAt: l.createdAt.toISOString(),
          adminName: l.admin.name ?? l.admin.email ?? "Unknown",
          adminEmail: l.admin.email ?? "",
        }))}
        total={total}
        page={pageNum}
        pageSize={PAGE_SIZE}
        currentAction={action ?? "ALL"}
        availableActions={["ALL", ...distinctActions.map((d) => d.action)]}
      />
    </div>
  );
}
