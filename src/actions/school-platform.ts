"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { createSchoolInvitationToken } from "@/lib/school-invitations";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const timezones = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const;

async function getPlatformAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") return null;
  return session.user.id;
}

const createSchoolSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  timezone: z.enum(timezones),
  ownerEmail: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export async function createSchoolTenant(formData: FormData): Promise<ActionResult<{ inviteUrl: string }>> {
  const adminId = await getPlatformAdmin();
  if (!adminId) return { success: false, error: "Akses hanya tersedia untuk Platform Admin." };

  const parsed = createSchoolSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    timezone: formData.get("timezone"),
    ownerEmail: formData.get("ownerEmail"),
  });
  if (!parsed.success) {
    return { success: false, error: "Isi nama sekolah, alamat singkat, zona waktu, dan email pemilik dengan benar." };
  }

  const owner = await prisma.user.findFirst({
    where: {
      email: { equals: parsed.data.ownerEmail, mode: "insensitive" },
      role: "PARENT",
      familySpaceId: { not: null },
    },
    select: { id: true },
  });
  if (!owner) {
    return { success: false, error: "Pemilik harus memakai akun orang tua yang sudah terdaftar dengan email tersebut." };
  }

  try {
    const { token, tokenHash } = createSchoolInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          timezone: parsed.data.timezone,
          status: "PENDING_REVIEW",
        },
      });
      const invitation = await tx.schoolInvitation.create({
        data: {
          schoolId: school.id,
          email: parsed.data.ownerEmail,
          role: "OWNER",
          tokenHash,
          expiresAt,
          createdById: adminId,
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "CREATE_SCHOOL_TENANT",
          targetType: "School",
          targetId: school.id,
          after: {
            schoolId: school.id,
            status: school.status,
            ownerInvitationId: invitation.id,
          },
        },
      });
    });
    revalidatePath("/superadmin/schools");
    revalidatePath("/school-admin");
    return { success: true, data: { inviteUrl: `/school-invite/${token}` } };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "Alamat singkat sekolah sudah digunakan." };
    }
    return { success: false, error: "Sekolah belum dapat dibuat. Silakan coba lagi." };
  }
}

const ownerInvitationSchema = z.object({ schoolId: z.string().uuid() });

export async function issueNewSchoolOwnerInvitation(formData: FormData): Promise<ActionResult<{ inviteUrl: string }>> {
  const adminId = await getPlatformAdmin();
  if (!adminId) return { success: false, error: "Akses hanya tersedia untuk Platform Admin." };

  const parsed = ownerInvitationSchema.safeParse({ schoolId: formData.get("schoolId") });
  if (!parsed.success) return { success: false, error: "Data sekolah tidak valid." };

  const school = await prisma.school.findUnique({
    where: { id: parsed.data.schoolId },
    select: {
      id: true,
      status: true,
      memberships: { where: { role: "OWNER" }, select: { id: true }, take: 1 },
      invitations: {
        where: { role: "OWNER" },
        select: { email: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!school) return { success: false, error: "Sekolah tidak ditemukan." };
  if (school.status === "SUSPENDED") return { success: false, error: "Aktifkan sekolah sebelum membuat undangan pemilik." };
  if (school.memberships.length) return { success: false, error: "Akun pemilik sudah pernah terhubung. Tinjau membership, jangan membuat undangan baru." };
  const previousInvitation = school.invitations[0];
  if (!previousInvitation) return { success: false, error: "Undangan pemilik sebelumnya tidak ditemukan." };

  const owner = await prisma.user.findFirst({
    where: {
      email: { equals: previousInvitation.email, mode: "insensitive" },
      role: "PARENT",
      familySpaceId: { not: null },
    },
    select: { id: true },
  });
  if (!owner) return { success: false, error: "Akun penerima undangan tidak lagi memenuhi syarat." };

  const { token, tokenHash } = createSchoolInvitationToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.schoolInvitation.updateMany({
        where: { schoolId: school.id, role: "OWNER", status: "PENDING" },
        data: { status: "REVOKED" },
      });
      const invitation = await tx.schoolInvitation.create({
        data: {
          schoolId: school.id,
          email: previousInvitation.email,
          role: "OWNER",
          tokenHash,
          expiresAt,
          createdById: adminId,
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "REISSUE_SCHOOL_OWNER_INVITATION",
          targetType: "School",
          targetId: school.id,
          before: { previousInvitationStatus: previousInvitation.status },
          after: { ownerInvitationId: invitation.id, status: invitation.status, expiresAt: invitation.expiresAt.toISOString() },
        },
      });
    });
    revalidatePath("/superadmin/schools");
    return { success: true, data: { inviteUrl: `/school-invite/${token}` } };
  } catch {
    return { success: false, error: "Tautan undangan pemilik belum dapat dibuat ulang." };
  }
}

const schoolStatusSchema = z.object({
  schoolId: z.string().uuid(),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export async function updateSchoolTenantStatus(formData: FormData): Promise<ActionResult<null>> {
  const adminId = await getPlatformAdmin();
  if (!adminId) return { success: false, error: "Akses hanya tersedia untuk Platform Admin." };

  const parsed = schoolStatusSchema.safeParse({
    schoolId: formData.get("schoolId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { success: false, error: "Status sekolah tidak valid." };

  try {
    const before = await prisma.school.findUnique({ where: { id: parsed.data.schoolId } });
    if (!before) return { success: false, error: "Sekolah tidak ditemukan." };
    if (before.status === parsed.data.status) return { success: true, data: null };

    await prisma.$transaction(async (tx) => {
      const after = await tx.school.update({
        where: { id: before.id },
        data: { status: parsed.data.status },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: parsed.data.status === "ACTIVE" ? "ACTIVATE_SCHOOL_TENANT" : "SUSPEND_SCHOOL_TENANT",
          targetType: "School",
          targetId: after.id,
          before: { status: before.status },
          after: { status: after.status },
        },
      });
    });
    revalidatePath("/superadmin/schools");
    revalidatePath("/school-admin");
    revalidatePath(`/school-admin/${before.slug}`);
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Status sekolah belum dapat diperbarui." };
  }
}