import { prisma } from "@/lib/prisma";
import LoginAttemptsClient from "./login-attempts-client";

export default async function LoginAttemptsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10));
  const PAGE_SIZE = 50;

  const query = q?.trim() ?? "";

  const where = query
    ? {
        OR: [
          { identifier: { contains: query } },
          { ipAddress: { contains: query } },
        ],
      }
    : {};

  // Hitung yang masih diblokir: identifier dengan ≥5 failure dalam 15 menit terakhir
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
  const blockedIdentifiers = await prisma.loginAttempt.groupBy({
    by: ["identifier"],
    where: {
      success: false,
      createdAt: { gte: fifteenMinsAgo },
    },
    _count: { identifier: true },
    having: { identifier: { _count: { gte: 5 } } },
  });

  const [attempts, total] = await Promise.all([
    prisma.loginAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.loginAttempt.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Log Percobaan Login</h1>
        <p className="text-gray-400 mt-1">Pantau dan unblock identifier yang diblokir rate limiter</p>
      </div>

      {/* Blocked identifiers alert */}
      {blockedIdentifiers.length > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
          <p className="text-red-400 font-semibold text-sm mb-2">
            ⚠️ {blockedIdentifiers.length} identifier aktif diblokir (≥5 gagal dalam 15 menit)
          </p>
          <div className="flex flex-wrap gap-2">
            {blockedIdentifiers.map((b) => (
              <span key={b.identifier} className="font-mono text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">
                {b.identifier} ({b._count.identifier}x)
              </span>
            ))}
          </div>
        </div>
      )}

      <LoginAttemptsClient
        attempts={attempts.map((a) => ({
          id: a.id,
          identifier: a.identifier,
          ipAddress: a.ipAddress,
          success: a.success,
          createdAt: a.createdAt.toISOString(),
        }))}
        blockedIdentifiers={blockedIdentifiers.map((b) => b.identifier)}
        total={total}
        page={pageNum}
        pageSize={PAGE_SIZE}
        initialQuery={query}
      />
    </div>
  );
}
