"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getSchoolManagerMembership } from "@/lib/school-access";
import { createSchoolInvitationToken, hashSchoolInvitationToken } from "@/lib/school-invitations";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { ActionResult } from "@/types";

const staffRoles = ["ADMIN", "PRINCIPAL", "TEACHER", "HOMEROOM_TEACHER"] as const;
const timezones = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const;

async function getActor(): Promise<{ id: string; role: string } | null> {
  const session = await auth();
  if (!session?.user || typeof session.user.id !== "string" || session.user.role === "CHILD") return null;
  return { id: session.user.id, role: session.user.role };
}

type ManagerMembership = NonNullable<Awaited<ReturnType<typeof getSchoolManagerMembership>>>;
type ManagerAccess =
  | { ok: true; actor: { id: string; role: string }; membership: ManagerMembership }
  | { ok: false; error: string };

async function requireManager(schoolId: string) {
  const actor = await getActor();
  if (!actor) return { ok: false as const, error: "Silakan masuk dengan akun admin sekolah." };

  const membership = await getSchoolManagerMembership(actor.id, { schoolId });
  if (!membership) return { ok: false as const, error: "Anda tidak memiliki izin mengelola sekolah ini." };
  if (membership.school.status === "SUSPENDED") {
    return { ok: false as const, error: "Sekolah sedang ditangguhkan. Pengelolaan sementara tidak tersedia." };
  }

  return { ok: true as const, actor, membership };
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  before: unknown,
  after: unknown,
) {
  const data: Prisma.AdminAuditLogUncheckedCreateInput = {
    adminId: actorId,
    action,
    targetType,
    targetId,
    after: after as Prisma.InputJsonValue,
  };
  if (before !== undefined) {
    data.before = before === null ? Prisma.JsonNull : (before as Prisma.InputJsonValue);
  }
  await tx.adminAuditLog.create({
    data,
  });
}

const schoolProfileSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  timezone: z.enum(timezones),
});

export async function updateSchoolProfile(formData: FormData): Promise<ActionResult<null>> {
  const parsed = schoolProfileSchema.safeParse({
    schoolId: formData.get("schoolId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) return { success: false, error: "Periksa kembali nama, alamat singkat, dan zona waktu." };

  const access = await requireManager(parsed.data.schoolId);
  if (!access.ok) return { success: false, error: access.error };

  try {
    const before = access.membership.school;
    const updated = await prisma.$transaction(async (tx) => {
      const school = await tx.school.update({
        where: { id: before.id },
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          timezone: parsed.data.timezone,
        },
      });
      await writeAudit(tx, access.actor.id, "UPDATE_SCHOOL_PROFILE", "School", school.id,
        { name: before.name, slug: before.slug, timezone: before.timezone },
        { name: school.name, slug: school.slug, timezone: school.timezone });
      return school;
    });
    revalidatePath("/school-admin");
    revalidatePath(`/school-admin/${before.slug}`);
    revalidatePath(`/school-admin/${updated.slug}`);
    return { success: true, data: null };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "Alamat singkat sudah dipakai sekolah lain." };
    }
    return { success: false, error: "Profil sekolah belum dapat disimpan. Silakan coba lagi." };
  }
}

const addMemberSchema = z.object({
  schoolId: z.string().uuid(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  role: z.enum(staffRoles),
});

export async function addSchoolMember(formData: FormData): Promise<ActionResult<{ inviteUrl: string }>> {
  const parsed = addMemberSchema.safeParse({
    schoolId: formData.get("schoolId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { success: false, error: "Email atau peran staf tidak valid." };

  const access = await requireManager(parsed.data.schoolId);
  if (!access.ok) return { success: false, error: access.error };

  const user = await prisma.user.findFirst({
    where: {
      email: { equals: parsed.data.email, mode: "insensitive" },
      role: "PARENT",
      familySpaceId: { not: null },
    },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    return { success: false, error: "Akun orang tersebut belum terdaftar. Tambahkan hanya akun staf yang sudah ada." };
  }

  try {
    const { token, tokenHash } = createSchoolInvitationToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await prisma.$transaction(async (tx) => {
      await tx.schoolInvitation.updateMany({
        where: {
          schoolId: access.membership.schoolId,
          email: { equals: parsed.data.email, mode: "insensitive" },
          status: "PENDING",
          expiresAt: { lte: now },
        },
        data: { status: "EXPIRED" },
      });
      const existing = await tx.schoolMembership.findUnique({
        where: { schoolId_userId: { schoolId: access.membership.schoolId, userId: user.id } },
      });
      if (existing?.status === "ACTIVE") throw new Error("STAFF_ALREADY_ACTIVE");
      if (existing?.status === "SUSPENDED") throw new Error("STAFF_MEMBERSHIP_SUSPENDED");

      const pendingInvite = await tx.schoolInvitation.findFirst({
        where: {
          schoolId: access.membership.schoolId,
          email: { equals: parsed.data.email, mode: "insensitive" },
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      });
      if (pendingInvite) throw new Error("INVITATION_ALREADY_PENDING");

      const invitation = await tx.schoolInvitation.create({
        data: {
          schoolId: access.membership.schoolId,
          email: user.email!,
          role: parsed.data.role,
          tokenHash,
          expiresAt,
          createdById: access.actor.id,
        },
      });
      await writeAudit(tx, access.actor.id, "CREATE_SCHOOL_INVITATION", "SchoolInvitation", invitation.id,
        null, { schoolId: invitation.schoolId, role: invitation.role, expiresAt: invitation.expiresAt.toISOString() });
    });
    revalidatePath(`/school-admin/${access.membership.school.slug}`);
    return { success: true, data: { inviteUrl: `/school-invite/${token}` } };
  } catch (error) {
    if (error instanceof Error && error.message === "STAFF_ALREADY_ACTIVE") {
      return { success: false, error: "Akun tersebut sudah menjadi anggota sekolah ini." };
    }
    if (error instanceof Error && error.message === "STAFF_MEMBERSHIP_SUSPENDED") {
      return { success: false, error: "Keanggotaan akun ini pernah ditangguhkan. Hubungi Platform Admin untuk meninjau aksesnya." };
    }
    if (error instanceof Error && error.message === "INVITATION_ALREADY_PENDING") {
      return { success: false, error: "Undangan untuk email ini masih berlaku di sekolah tersebut." };
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "Undangan aktif untuk email ini sudah ada." };
    }
    return { success: false, error: "Staf belum dapat ditambahkan. Silakan coba lagi." };
  }
}

const revokeInvitationSchema = z.object({
  schoolId: z.string().uuid(),
  invitationId: z.string().uuid(),
});

export async function revokeSchoolInvitation(formData: FormData): Promise<ActionResult<null>> {
  const parsed = revokeInvitationSchema.safeParse({
    schoolId: formData.get("schoolId"),
    invitationId: formData.get("invitationId"),
  });
  if (!parsed.success) return { success: false, error: "Data undangan tidak valid." };

  const access = await requireManager(parsed.data.schoolId);
  if (!access.ok) return { success: false, error: access.error };

  try {
    await prisma.$transaction(async (tx) => {
      const invitation = await tx.schoolInvitation.findFirst({
        where: {
          id: parsed.data.invitationId,
          schoolId: access.membership.schoolId,
          status: "PENDING",
        },
      });
      if (!invitation) throw new Error("INVITATION_NOT_FOUND");
      await tx.schoolInvitation.update({
        where: { id: invitation.id },
        data: { status: "REVOKED" },
      });
      await writeAudit(tx, access.actor.id, "REVOKE_SCHOOL_INVITATION", "SchoolInvitation", invitation.id,
        { status: invitation.status }, { status: "REVOKED" });
    });
    revalidatePath(`/school-admin/${access.membership.school.slug}`);
    return { success: true, data: null };
  } catch (error) {
    if (error instanceof Error && error.message === "INVITATION_NOT_FOUND") {
      return { success: false, error: "Undangan aktif tidak ditemukan di sekolah ini." };
    }
    return { success: false, error: "Undangan belum dapat dicabut." };
  }
}

export async function acceptSchoolInvitation(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  const token = formData.get("token");
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    return { success: false, error: "Tautan undangan tidak valid." };
  }

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PARENT" || !session.user.email) {
    return { success: false, error: "Masuk dengan akun orang tua yang memiliki email undangan." };
  }
  const email = session.user.email.trim().toLowerCase();
  const tokenHash = hashSchoolInvitationToken(token);

  try {
    const accepted = await prisma.$transaction(async (tx) => {
      const invitation = await tx.schoolInvitation.findUnique({
        where: { tokenHash },
        include: { school: true },
      });
      if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date()) {
        throw new Error("INVITATION_EXPIRED");
      }
      if (invitation.school.status === "SUSPENDED") throw new Error("SCHOOL_SUSPENDED");
      if (invitation.email.trim().toLowerCase() !== email) throw new Error("EMAIL_MISMATCH");

      const existing = await tx.schoolMembership.findUnique({
        where: {
          schoolId_userId: {
            schoolId: invitation.schoolId,
            userId: session.user.id,
          },
        },
      });
      if (existing) throw new Error("MEMBERSHIP_EXISTS");

      const membership = await tx.schoolMembership.create({
        data: {
          schoolId: invitation.schoolId,
          userId: session.user.id,
          role: invitation.role,
          status: "ACTIVE",
        },
      });
      await tx.schoolInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedById: session.user.id,
          acceptedAt: new Date(),
        },
      });
      await writeAudit(tx, session.user.id, "ACCEPT_SCHOOL_INVITATION", "SchoolInvitation", invitation.id,
        { status: invitation.status, role: invitation.role },
        { status: "ACCEPTED", membershipId: membership.id });

      return {
        schoolSlug: invitation.school.slug,
        role: invitation.role,
      };
    });
    revalidatePath("/school-admin");
    revalidatePath(`/school-admin/${accepted.schoolSlug}`);
    return {
      success: true,
      data: {
        redirectTo: accepted.role === "OWNER" || accepted.role === "ADMIN"
          ? `/school-admin/${accepted.schoolSlug}`
          : "/school-invite/accepted",
      },
    };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "INVITATION_EXPIRED") return { success: false, error: "Undangan tidak berlaku atau sudah kedaluwarsa." };
    if (code === "SCHOOL_SUSPENDED") return { success: false, error: "Sekolah sedang ditangguhkan; undangan tidak dapat diterima." };
    if (code === "EMAIL_MISMATCH") return { success: false, error: "Email akun yang sedang masuk tidak cocok dengan email undangan." };
    if (code === "MEMBERSHIP_EXISTS") return { success: false, error: "Akun ini sudah memiliki atau pernah memiliki akses di sekolah tersebut." };
    return { success: false, error: "Undangan belum dapat diterima. Silakan coba lagi." };
  }
}

const memberStatusSchema = z.object({
  schoolId: z.string().uuid(),
  memberId: z.string().uuid(),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export async function setSchoolMemberStatus(formData: FormData): Promise<ActionResult<null>> {
  const parsed = memberStatusSchema.safeParse({
    schoolId: formData.get("schoolId"),
    memberId: formData.get("memberId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { success: false, error: "Data status anggota tidak valid." };

  const access = await requireManager(parsed.data.schoolId);
  if (!access.ok) return { success: false, error: access.error };

  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.schoolMembership.findFirst({
        where: { id: parsed.data.memberId, schoolId: access.membership.schoolId },
      });
      if (!before) throw new Error("MEMBER_NOT_FOUND");
      if (before.userId === access.actor.id) throw new Error("CANNOT_CHANGE_SELF");
      if (before.role === "OWNER") throw new Error("OWNER_ACCESS_RESTRICTED");
      if (before.status === parsed.data.status) return;

      const after = await tx.schoolMembership.update({
        where: { id: before.id },
        data: { status: parsed.data.status },
      });
      await writeAudit(tx, access.actor.id, "UPDATE_SCHOOL_MEMBER_STATUS", "SchoolMembership", after.id,
        { role: before.role, status: before.status },
        { role: after.role, status: after.status });
    });
    revalidatePath(`/school-admin/${access.membership.school.slug}`);
    return { success: true, data: null };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "MEMBER_NOT_FOUND") return { success: false, error: "Anggota tidak ditemukan di sekolah ini." };
    if (code === "CANNOT_CHANGE_SELF") return { success: false, error: "Anda tidak dapat mengubah status akun sendiri." };
    if (code === "OWNER_ACCESS_RESTRICTED") return { success: false, error: "Akses pemilik sekolah hanya dapat ditinjau Platform Admin." };
    return { success: false, error: "Status anggota belum dapat diperbarui." };
  }
}

const createClassSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  grade: z.string().trim().min(1).max(40),
  academicYear: z.string().trim().regex(/^\d{4}\/\d{4}$/),
});

export async function createSchoolClass(formData: FormData): Promise<ActionResult<null>> {
  const parsed = createClassSchema.safeParse({
    schoolId: formData.get("schoolId"),
    name: formData.get("name"),
    grade: formData.get("grade"),
    academicYear: formData.get("academicYear"),
  });
  if (!parsed.success) return { success: false, error: "Isi nama kelas, tingkat, dan tahun ajaran (contoh: 2026/2027)." };

  const access = await requireManager(parsed.data.schoolId);
  if (!access.ok) return { success: false, error: access.error };
  try {
    const schoolClass = await prisma.$transaction(async (tx) => {
      const created = await tx.schoolClass.create({
        data: {
          schoolId: access.membership.schoolId,
          name: parsed.data.name,
          grade: parsed.data.grade,
          academicYear: parsed.data.academicYear,
        },
      });
      await writeAudit(tx, access.actor.id, "CREATE_SCHOOL_CLASS", "SchoolClass", created.id,
        null, { schoolId: created.schoolId, grade: created.grade, academicYear: created.academicYear });
      return created;
    });
    revalidatePath(`/school-admin/${access.membership.school.slug}`);
    return { success: true, data: null };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "Nama kelas sudah digunakan pada tahun ajaran tersebut." };
    }
    return { success: false, error: "Kelas belum dapat dibuat." };
  }
}

const createStudentSchema = z.object({
  schoolId: z.string().uuid(),
  displayName: z.string().trim().min(2).max(100),
  localCode: z.string().trim().max(40).optional().transform((value) => value || null),
  classId: z.string().uuid(),
});

export async function createSchoolStudent(formData: FormData): Promise<ActionResult<null>> {
  const parsed = createStudentSchema.safeParse({
    schoolId: formData.get("schoolId"),
    displayName: formData.get("displayName"),
    localCode: formData.get("localCode"),
    classId: formData.get("classId"),
  });
  if (!parsed.success) return { success: false, error: "Periksa nama siswa, kode lokal, dan kelas yang dipilih." };

  const access = await requireManager(parsed.data.schoolId);
  if (!access.ok) return { success: false, error: access.error };
  if (access.membership.school.status !== "ACTIVE") {
    return { success: false, error: "Roster siswa baru dapat dikelola setelah sekolah disetujui Platform Admin." };
  }

  const schoolClass = await prisma.schoolClass.findFirst({
    where: { id: parsed.data.classId, schoolId: access.membership.schoolId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!schoolClass) return { success: false, error: "Kelas tidak aktif atau bukan milik sekolah ini." };

  try {
    await prisma.$transaction(async (tx) => {
      const student = await tx.schoolStudent.create({
        data: {
          schoolId: access.membership.schoolId,
          displayName: parsed.data.displayName,
          localCode: parsed.data.localCode,
        },
      });
      const enrollment = await tx.schoolEnrollment.create({
        data: {
          schoolId: access.membership.schoolId,
          studentId: student.id,
          classId: schoolClass.id,
        },
      });
      await writeAudit(tx, access.actor.id, "CREATE_SCHOOL_STUDENT", "SchoolStudent", student.id,
        null, { schoolId: student.schoolId, enrollmentId: enrollment.id, classId: schoolClass.id });
    });
    revalidatePath(`/school-admin/${access.membership.school.slug}`);
    return { success: true, data: null };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "Kode siswa lokal sudah digunakan di sekolah ini." };
    }
    return { success: false, error: "Catatan siswa belum dapat disimpan." };
  }
}

const studentStatusSchema = z.object({
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export async function setSchoolStudentStatus(formData: FormData): Promise<ActionResult<null>> {
  const parsed = studentStatusSchema.safeParse({
    schoolId: formData.get("schoolId"),
    studentId: formData.get("studentId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { success: false, error: "Data status siswa tidak valid." };

  const access = await requireManager(parsed.data.schoolId);
  if (!access.ok) return { success: false, error: access.error };
  if (access.membership.school.status !== "ACTIVE") {
    return { success: false, error: "Roster siswa hanya dapat diubah setelah sekolah aktif." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.schoolStudent.findFirst({
        where: { id: parsed.data.studentId, schoolId: access.membership.schoolId },
        include: { enrollments: { orderBy: { startedAt: "desc" }, take: 1 } },
      });
      if (!before) throw new Error("STUDENT_NOT_FOUND");
      if (before.status === parsed.data.status) return;

      let enrollmentId: string | null = null;
      if (parsed.data.status === "INACTIVE") {
        const updated = await tx.schoolEnrollment.updateMany({
          where: { schoolId: access.membership.schoolId, studentId: before.id, status: "ACTIVE" },
          data: { status: "ENDED", endedAt: new Date() },
        });
        enrollmentId = updated.count ? before.enrollments[0]?.id ?? null : null;
      } else {
        const previousEnrollment = before.enrollments[0];
        if (!previousEnrollment) throw new Error("STUDENT_CLASS_REQUIRED");
        const previousClass = await tx.schoolClass.findFirst({
          where: { id: previousEnrollment.classId, schoolId: access.membership.schoolId, status: "ACTIVE" },
          select: { id: true },
        });
        if (!previousClass) throw new Error("STUDENT_CLASS_UNAVAILABLE");
        const enrollment = await tx.schoolEnrollment.create({
          data: {
            schoolId: access.membership.schoolId,
            studentId: before.id,
            classId: previousClass.id,
          },
        });
        enrollmentId = enrollment.id;
      }

      await tx.schoolStudent.update({
        where: { id: before.id },
        data: { status: parsed.data.status },
      });
      await writeAudit(tx, access.actor.id, "UPDATE_SCHOOL_STUDENT_STATUS", "SchoolStudent", before.id,
        { status: before.status, enrollmentId: before.enrollments[0]?.id ?? null },
        { status: parsed.data.status, enrollmentId });
    });
    revalidatePath(`/school-admin/${access.membership.school.slug}`);
    return { success: true, data: null };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "STUDENT_NOT_FOUND") return { success: false, error: "Siswa tidak ditemukan di sekolah ini." };
    if (code === "STUDENT_CLASS_REQUIRED" || code === "STUDENT_CLASS_UNAVAILABLE") {
      return { success: false, error: "Siswa tidak dapat diaktifkan kembali karena kelas terakhirnya sudah tidak tersedia." };
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "Siswa sudah memiliki enrollment aktif." };
    }
    return { success: false, error: "Status siswa belum dapat diperbarui." };
  }
}