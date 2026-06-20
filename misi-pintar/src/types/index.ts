import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      familySpaceId: string;
    } & DefaultSession["user"];
  }
}

export type UserRole = "PARENT" | "SUPERADMIN";

export type PlanType = "STARTER" | "PRO" | "EDUCATOR" | "SCHOOL";

export type SubStatus =
  | "TRIAL"
  | "FREE"
  | "PRO"
  | "EDUCATOR"
  | "SCHOOL"
  | "EXPIRED"
  | "CANCELLED";

export type InvStatus =
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "FAILED"
  | "REFUNDED";

export type PayMethod =
  | "QRIS"
  | "GOPAY"
  | "SHOPEEPAY"
  | "BANK_TRANSFER"
  | "CREDIT_CARD"
  | "VA";

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };
