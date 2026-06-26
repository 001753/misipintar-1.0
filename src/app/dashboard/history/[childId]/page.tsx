export const dynamic = 'force-dynamic'
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HistoryClient from "./history-client";

interface Props {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{
    page?: string;
    type?: string;
    from?: string;
    to?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function ChildHistoryPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session || session.user.role !== "PARENT") redirect("/login");

  const { childId } = await params;
  const { page, type, from, to } = await searchParams;

  const familySpaceId = session.user.familySpaceId!;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

  // Pastikan anak ini milik family space yang benar (tenant isolation)
  const child = await prisma.child.findFirst({
    where: { id: childId, familySpaceId, deletedAt: null },
    select: { id: true, name: true, avatar: true },
  });
  if (!child) redirect("/dashboard");

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
      basePath={`/dashboard/history/${childId}`}
      viewerRole="PARENT"
    />
  );
}
