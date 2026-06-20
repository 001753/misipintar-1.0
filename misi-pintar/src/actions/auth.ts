"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ActionResult } from "@/types";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60;

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  familyName: z.string().min(2),
});

export async function registerAction(
  formData: FormData
): Promise<ActionResult<{ familySpaceId: string }>> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: "Data tidak valid." };
  }

  const { name, email, password, familyName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Email sudah terdaftar." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const starterPlan = await prisma.plan.findUnique({
    where: { type: "STARTER" },
  });

  const result = await prisma.$transaction(async (tx) => {
    const familySpace = await tx.familySpace.create({
      data: { name: familyName },
    });

    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "PARENT",
        familySpaceId: familySpace.id,
      },
    });

    if (starterPlan) {
      await tx.subscription.create({
        data: {
          familySpaceId: familySpace.id,
          planId: starterPlan.id,
          status: "TRIAL",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { familySpaceId: familySpace.id };
  });

  return { success: true, data: result };
}

export async function loginAction(formData: FormData, ip?: string) {
  const identifier = formData.get("email") as string;
  const rateLimitKey = `login_attempts:${identifier}`;

  const attempts = await redis.incr(rateLimitKey);
  if (attempts === 1) await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);

  if (attempts > RATE_LIMIT_MAX) {
    await prisma.loginAttempt.create({
      data: { identifier, success: false, ip },
    });
    return { success: false, error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." };
  }

  try {
    await signIn("credentials", formData);
    await redis.del(rateLimitKey);
    await prisma.loginAttempt.create({
      data: { identifier, success: true, ip },
    });
    return { success: true };
  } catch {
    await prisma.loginAttempt.create({
      data: { identifier, success: false, ip },
    });
    return { success: false, error: "Email atau password salah." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
