/**
 * [5.4] FCM Token Management
 * POST /api/fcm/register  — simpan token ke DB
 * DELETE /api/fcm/register — hapus token (logout)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(10),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
  }

  const { token } = parsed.data;
  const userId = session.user.role === "PARENT" || session.user.role === "SUPER_ADMIN"
    ? session.user.id
    : null;
  const childId = session.user.role === "CHILD" ? session.user.childId ?? null : null;

  // Upsert: token unik — kalau sudah ada, update relasi
  await prisma.fcmToken.upsert({
    where: { token },
    update: { userId, childId },
    create: { token, userId, childId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
  }

  const { token } = parsed.data;

  await prisma.fcmToken.deleteMany({ where: { token } });

  return NextResponse.json({ ok: true });
}
