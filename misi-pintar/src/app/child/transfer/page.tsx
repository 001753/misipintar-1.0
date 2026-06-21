import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChildTransferClient from "./child-transfer-client";

export default async function ChildTransferPage() {
  const session = await auth();
  if (!session || session.user.role !== "CHILD") redirect("/login");

  const childId = session.user.childId!;
  const familySpaceId = session.user.familySpaceId!;

  const child = await prisma.child.findFirst({
    where: { id: childId, familySpaceId, deletedAt: null },
    select: {
      id: true,
      name: true,
      avatar: true,
      balance: true,
      savingsBalance: true,
      charityBalance: true,
    },
  });

  if (!child) redirect("/login");

  return <ChildTransferClient child={child} />;
}
