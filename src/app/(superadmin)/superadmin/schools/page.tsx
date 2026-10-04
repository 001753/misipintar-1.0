import {
  createSchoolTenant,
  issueNewSchoolOwnerInvitation,
  updateSchoolTenantStatus,
} from "@/actions/school-platform";
import { PlatformSchoolWorkspace } from "@/components/school-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sekolah — Superadmin" };

export default async function PlatformSchoolsPage() {
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      timezone: true,
      createdAt: true,
      memberships: {
        where: { role: "OWNER" },
        select: { user: { select: { email: true } } },
        take: 1,
      },
      invitations: {
        where: { role: "OWNER" },
        select: { email: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PlatformSchoolWorkspace
      schools={schools.map((school) => ({
        id: school.id,
        name: school.name,
        slug: school.slug,
        status: school.status,
        timezone: school.timezone,
        ownerEmail: school.memberships[0]?.user.email ?? school.invitations[0]?.email ?? "",
        ownerNeedsInvitation: school.memberships.length === 0 && school.invitations.length > 0,
      }))}
      createSchool={createSchoolTenant}
      issueOwnerInvitation={issueNewSchoolOwnerInvitation}
      updateStatus={updateSchoolTenantStatus}
    />
  );
}