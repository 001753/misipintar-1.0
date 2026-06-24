"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

type TransferResult =
  | { success: true; newBalance: number; newSavingsBalance: number; newCharityBalance: number }
  | { error: "INSUFFICIENT_BALANCE" | "UNAUTHORIZED" | "INVALID_AMOUNT" | "NOT_FOUND" };

async function resolveChildAndFamilySpace(childId: string) {
  const session = await auth();
  if (!session) return null;

  const child = await prisma.child.findUnique({
    where: { id: childId, deletedAt: null },
    include: {
      familySpace: {
        include: {
          users: { select: { id: true } },
        },
      },
    },
  });
  if (!child) return null;

  const role = session.user.role;
  if (role === "PARENT") {
    const belongs = child.familySpace.users.some((u) => u.id === session.user.id);
    if (!belongs) return null;
  } else if (role === "CHILD") {
    if (session.user.childId !== childId) return null;
  } else {
    return null;
  }

  return child;
}

// ─────────────────────────────────────────────────────────
// [3.1] Transfer ke Tabungan
// ─────────────────────────────────────────────────────────
export async function transferToSavings(
  childId: string,
  amount: number
): Promise<TransferResult> {
  if (!Number.isInteger(amount) || amount <= 0) return { error: "INVALID_AMOUNT" };

  const child = await resolveChildAndFamilySpace(childId);
  if (!child) return { error: "UNAUTHORIZED" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.child.findUniqueOrThrow({
        where: { id: childId },
        select: { balance: true, savingsBalance: true, charityBalance: true },
      });

      if (current.balance < amount) throw new Error("INSUFFICIENT_BALANCE");

      const updated = await tx.child.update({
        where: { id: childId },
        data: { balance: { decrement: amount }, savingsBalance: { increment: amount } },
        select: { balance: true, savingsBalance: true, charityBalance: true },
      });

      await tx.transactionLedger.createMany({
        data: [
          {
            familySpaceId: child.familySpaceId,
            childId,
            type: "SAVINGS_DEPOSIT",
            amount,
            balanceBefore: current.savingsBalance,
            balanceAfter: updated.savingsBalance,
            description: `Transfer ke tabungan: Rp ${amount.toLocaleString("id-ID")}`,
          },
          {
            familySpaceId: child.familySpaceId,
            childId,
            type: "ADJUSTMENT",
            amount: -amount,
            balanceBefore: current.balance,
            balanceAfter: updated.balance,
            description: `Pengurangan saldo utama (transfer ke tabungan): Rp ${amount.toLocaleString("id-ID")}`,
          },
        ],
      });

      await tx.notification.create({
        data: {
          familySpaceId: child.familySpaceId,
          title: "Transfer ke Tabungan",
          body: `Rp ${amount.toLocaleString("id-ID")} dipindah ke tabungan. Saldo tabungan baru: Rp ${updated.savingsBalance.toLocaleString("id-ID")}`,
          type: "SAVINGS_DEPOSIT",
        },
      });

      return updated;
    });

    return {
      success: true,
      newBalance: result.balance,
      newSavingsBalance: result.savingsBalance,
      newCharityBalance: result.charityBalance,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE")
      return { error: "INSUFFICIENT_BALANCE" };
    throw err;
  }
}

// ─────────────────────────────────────────────────────────
// [3.1] Transfer ke Sedekah
// ─────────────────────────────────────────────────────────
export async function transferToCharity(
  childId: string,
  amount: number
): Promise<TransferResult> {
  if (!Number.isInteger(amount) || amount <= 0) return { error: "INVALID_AMOUNT" };

  const child = await resolveChildAndFamilySpace(childId);
  if (!child) return { error: "UNAUTHORIZED" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.child.findUniqueOrThrow({
        where: { id: childId },
        select: { balance: true, savingsBalance: true, charityBalance: true },
      });

      if (current.balance < amount) throw new Error("INSUFFICIENT_BALANCE");

      const updated = await tx.child.update({
        where: { id: childId },
        data: { balance: { decrement: amount }, charityBalance: { increment: amount } },
        select: { balance: true, savingsBalance: true, charityBalance: true },
      });

      await tx.transactionLedger.createMany({
        data: [
          {
            familySpaceId: child.familySpaceId,
            childId,
            type: "CHARITY",
            amount,
            balanceBefore: current.charityBalance,
            balanceAfter: updated.charityBalance,
            description: `Transfer ke sedekah: Rp ${amount.toLocaleString("id-ID")}`,
          },
          {
            familySpaceId: child.familySpaceId,
            childId,
            type: "ADJUSTMENT",
            amount: -amount,
            balanceBefore: current.balance,
            balanceAfter: updated.balance,
            description: `Pengurangan saldo utama (transfer ke sedekah): Rp ${amount.toLocaleString("id-ID")}`,
          },
        ],
      });

      await tx.notification.create({
        data: {
          familySpaceId: child.familySpaceId,
          title: "Transfer ke Sedekah 🤲",
          body: `Rp ${amount.toLocaleString("id-ID")} dipindah ke sedekah. Saldo sedekah baru: Rp ${updated.charityBalance.toLocaleString("id-ID")}`,
          type: "CHARITY",
        },
      });

      return updated;
    });

    return {
      success: true,
      newBalance: result.balance,
      newSavingsBalance: result.savingsBalance,
      newCharityBalance: result.charityBalance,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE")
      return { error: "INSUFFICIENT_BALANCE" };
    throw err;
  }
}

// ─────────────────────────────────────────────────────────
// [3.1] Tarik dari Tabungan → Saldo Utama
// ─────────────────────────────────────────────────────────
export async function withdrawFromSavings(
  childId: string,
  amount: number
): Promise<TransferResult> {
  if (!Number.isInteger(amount) || amount <= 0) return { error: "INVALID_AMOUNT" };

  const child = await resolveChildAndFamilySpace(childId);
  if (!child) return { error: "UNAUTHORIZED" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.child.findUniqueOrThrow({
        where: { id: childId },
        select: { balance: true, savingsBalance: true, charityBalance: true },
      });

      if (current.savingsBalance < amount) throw new Error("INSUFFICIENT_BALANCE");

      const updated = await tx.child.update({
        where: { id: childId },
        data: { savingsBalance: { decrement: amount }, balance: { increment: amount } },
        select: { balance: true, savingsBalance: true, charityBalance: true },
      });

      await tx.transactionLedger.createMany({
        data: [
          {
            familySpaceId: child.familySpaceId,
            childId,
            type: "SAVINGS_WITHDRAW",
            amount: -amount,
            balanceBefore: current.savingsBalance,
            balanceAfter: updated.savingsBalance,
            description: `Penarikan dari tabungan: Rp ${amount.toLocaleString("id-ID")}`,
          },
          {
            familySpaceId: child.familySpaceId,
            childId,
            type: "ADJUSTMENT",
            amount,
            balanceBefore: current.balance,
            balanceAfter: updated.balance,
            description: `Penambahan saldo utama (tarik dari tabungan): Rp ${amount.toLocaleString("id-ID")}`,
          },
        ],
      });

      return updated;
    });

    return {
      success: true,
      newBalance: result.balance,
      newSavingsBalance: result.savingsBalance,
      newCharityBalance: result.charityBalance,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE")
      return { error: "INSUFFICIENT_BALANCE" };
    throw err;
  }
}
