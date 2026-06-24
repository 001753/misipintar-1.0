import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HistoryClient from "@/app/dashboard/history/[childId]/history-client";

interface Props {
  searchParams: Promise<{
    page?: string;
    type?: string;
    from?: string;
    to?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function ChildSelfHistoryPage({ searchParams }: Props) {
  const session = await auth();
  if (!session || session.user.role !== "CHILD") redirect("/login");

  const childId = session.user.childId!;
  const familySpaceId = session.user.familySpaceId!;
  const { page, type, from, to } = await searchParams;

  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

  const child = await prisma.child.findFirst({
    where: { id: childId, familySpaceId, deletedAt: null },
    select: { id: true, name: true, avatar: true },
  });
  if (!child) redirect("/login");

  const where = {
    childId,
    familySpaceId,
    ...(type ? { type: type as never } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.transactionLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.transactionLedger.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <HistoryClient
      child={child}
      entries={entries.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      }))}
      total={total}
      currentPage={currentPage}
      totalPages={totalPages}
      filters={{ type, from, to }}
      basePath="/child/history"
      viewerRole="CHILD"
    />
  );
}
