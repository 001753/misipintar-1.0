import { prisma } from "@/lib/prisma";

export const SCHOOL_MANAGER_ROLES = ["OWNER", "ADMIN"] as const;

export function isSchoolManagerRole(role: string): role is (typeof SCHOOL_MANAGER_ROLES)[number] {
  return SCHOOL_MANAGER_ROLES.some((managerRole) => managerRole === role);
}

export async function getSchoolManagerMembership(
  userId: string,
  scope: { schoolId: string } | { schoolSlug: string },
) {
  return prisma.schoolMembership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      role: { in: [...SCHOOL_MANAGER_ROLES] },
      school: "schoolId" in scope ? { id: scope.schoolId } : { slug: scope.schoolSlug },
    },
    include: { school: true },
  });
}