import {
  addSchoolMember,
  revokeSchoolInvitation,
  createSchoolClass,
  createSchoolStudent,
  setSchoolMemberStatus,
  setSchoolStudentStatus,
  updateSchoolProfile,
} from "@/actions/school-admin";
import { SchoolAdminWorkspace } from "@/components/school-admin";
import { auth } from "@/lib/auth/config";
import { getSchoolManagerMembership } from "@/lib/school-access";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = { title: "Administrasi sekolah — JOBEN" };

export default async function SchoolAdminPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role === "CHILD") redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/superadmin/schools");

  const { schoolSlug } = await params;
  const membership = await getSchoolManagerMembership(session.user.id, { schoolSlug });
  if (!membership) notFound();

  if (membership.school.status === "SUSPENDED") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f4ee] px-4 text-[#243a32]">
        <section className="max-w-lg rounded-2xl border border-rose-200 bg-[#fffefa] p-6 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a4513d]">Akses ditangguhkan</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-[#263e34]">{membership.school.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6e7e75]">Platform Admin menangguhkan tenant ini. Data sekolah tidak dihapus dan pengelolaan sementara tidak tersedia.</p>
          <a href="/school-admin" className="mt-5 inline-flex font-semibold text-[#39745e] underline underline-offset-4">Kembali ke pemilih sekolah</a>
        </section>
      </main>
    );
  }

  const schoolId = membership.schoolId;
  const [members, classes, students, enrollments, invitations, memberCount, studentCount] = await Promise.all([
    prisma.schoolMembership.findMany({
      where: { schoolId },
      select: {
        id: true,
        userId: true,
        role: true,
        status: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.schoolClass.findMany({
      where: { schoolId },
      select: { id: true, name: true, grade: true, academicYear: true, status: true },
      orderBy: [{ academicYear: "desc" }, { name: "asc" }],
    }),
    prisma.schoolStudent.findMany({
      where: { schoolId },
      select: {
        id: true,
        displayName: true,
        localCode: true,
        status: true,
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { startedAt: "desc" },
          take: 1,
          select: { schoolClass: { select: { name: true, academicYear: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.schoolEnrollment.findMany({
      where: { schoolId, status: "ACTIVE" },
      select: { classId: true, student: { select: { status: true } } },
    }),
    prisma.schoolInvitation.findMany({
      where: { schoolId, status: "PENDING" },
      select: { id: true, email: true, role: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.schoolMembership.count({ where: { schoolId, status: "ACTIVE" } }),
    prisma.schoolStudent.count({ where: { schoolId, status: "ACTIVE" } }),
  ]);

  const classCounts = new Map<string, number>();
  for (const enrollment of enrollments) {
    if (enrollment.student.status === "ACTIVE") {
      classCounts.set(enrollment.classId, (classCounts.get(enrollment.classId) ?? 0) + 1);
    }
  }

  return (
    <SchoolAdminWorkspace
      school={{
        id: membership.school.id,
        name: membership.school.name,
        slug: membership.school.slug,
        status: membership.school.status,
        timezone: membership.school.timezone,
      }}
      currentUserId={session.user.id}
      counts={{
        members: memberCount,
        classes: classes.filter((schoolClass) => schoolClass.status === "ACTIVE").length,
        students: studentCount,
      }}
      members={members.map((member) => ({
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        email: member.user.email ?? "Email belum tersedia",
        role: member.role,
        status: member.status,
      }))}
      classes={classes.map((schoolClass) => ({
        ...schoolClass,
        studentCount: classCounts.get(schoolClass.id) ?? 0,
      }))}
      students={students.map((student) => ({
        id: student.id,
        displayName: student.displayName,
        localCode: student.localCode ?? "",
        status: student.status,
        className: student.enrollments[0]?.schoolClass.name ?? "",
        academicYear: student.enrollments[0]?.schoolClass.academicYear ?? "",
      }))}
      invitations={invitations.map((invitation) => ({
        ...invitation,
        expiresAt: invitation.expiresAt.toISOString(),
        expired: invitation.expiresAt <= new Date(),
      }))}
      updateSchool={updateSchoolProfile}
      addMember={addSchoolMember}
      revokeInvitation={revokeSchoolInvitation}
      setMemberStatus={setSchoolMemberStatus}
      createClass={createSchoolClass}
      createStudent={createSchoolStudent}
      setStudentStatus={setSchoolStudentStatus}
    />
  );
}