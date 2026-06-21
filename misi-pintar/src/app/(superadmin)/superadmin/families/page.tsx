import { prisma } from "@/lib/prisma";
import FamiliesClient from "./families-client";

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const families = await prisma.familySpace.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { spaceCode: { contains: query.toUpperCase() } },
            { owner: { email: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {},
    include: {
      owner: { select: { email: true, name: true } },
      subscription: {
        include: { plan: { select: { name: true, type: true } } },
      },
      _count: { select: { children: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const SUB_STATUS_COLORS: Record<string, string> = {
    FREE: "bg-gray-600 text-gray-300",
    PRO: "bg-emerald-900 text-emerald-300",
    EDUCATOR: "bg-purple-900 text-purple-300",
    SCHOOL: "bg-orange-900 text-orange-300",
    EXPIRED: "bg-red-900 text-red-300",
    CANCELLED: "bg-red-900 text-red-300",
    TRIAL: "bg-blue-900 text-blue-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manajemen Keluarga</h1>
        <p className="text-gray-400 mt-1">Cari, lihat detail, dan kelola FamilySpace</p>
      </div>

      <FamiliesClient
        families={families.map((f) => ({
          id: f.id,
          name: f.name,
          spaceCode: f.spaceCode,
          createdAt: f.createdAt.toISOString(),
          ownerEmail: f.owner.email,
          ownerName: f.owner.name ?? "",
          subStatus: f.subscription?.status ?? "FREE",
          planName: f.subscription?.plan.name ?? "Starter",
          childCount: f._count.children,
        }))}
        subStatusColors={SUB_STATUS_COLORS}
        initialQuery={query}
      />
    </div>
  );
}
