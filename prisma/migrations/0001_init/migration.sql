-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'CHILD', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('STARTER', 'PRO', 'EDUCATOR', 'SCHOOL');

-- CreateEnum
CREATE TYPE "SubStatus" AS ENUM ('TRIAL', 'FREE', 'PRO', 'EDUCATOR', 'SCHOOL', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayMethod" AS ENUM ('QRIS', 'GOPAY', 'SHOPEEPAY', 'BANK_TRANSFER', 'CREDIT_CARD', 'VA');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'CLAIMED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('TASK_REWARD', 'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAW', 'CHARITY', 'INTEREST', 'TAX', 'FINE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PhaseMode" AS ENUM ('FULL_FREE', 'FREEMIUM', 'PAID_ONLY');

-- CreateTable
CREATE TABLE "FamilySpace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spaceCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilySpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARENT',
    "familySpaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "familySpaceId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "savingsBalance" INTEGER NOT NULL DEFAULT 0,
    "charityBalance" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "rewardAmount" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "proofPhotoUrl" TEXT,
    "claimedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLedger" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "type" "TxType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "type" "PlanType" NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "yearlyPrice" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "limits" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubStatus" NOT NULL DEFAULT 'FREE',
    "invoiceId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "InvStatus" NOT NULL DEFAULT 'PENDING',
    "midtransOrderId" TEXT,
    "snapToken" TEXT,
    "paymentMethod" "PayMethod",
    "paidAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FcmToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FcmToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL DEFAULT 'global-config',
    "phaseMode" "PhaseMode" NOT NULL DEFAULT 'FULL_FREE',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FamilySpace_spaceCode_key" ON "FamilySpace"("spaceCode");

-- CreateIndex
CREATE UNIQUE INDEX "FamilySpace_ownerId_key" ON "FamilySpace"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_familySpaceId_role_idx" ON "User"("familySpaceId", "role");

-- CreateIndex
CREATE INDEX "Child_familySpaceId_idx" ON "Child"("familySpaceId");

-- CreateIndex
CREATE INDEX "Child_familySpaceId_deletedAt_idx" ON "Child"("familySpaceId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Child_familySpaceId_username_key" ON "Child"("familySpaceId", "username");

-- CreateIndex
CREATE INDEX "Task_familySpaceId_childId_status_idx" ON "Task"("familySpaceId", "childId", "status");

-- CreateIndex
CREATE INDEX "TransactionLedger_familySpaceId_childId_createdAt_idx" ON "TransactionLedger"("familySpaceId", "childId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_type_key" ON "Plan"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_familySpaceId_key" ON "Subscription"("familySpaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_invoiceId_key" ON "Subscription"("invoiceId");

-- CreateIndex
CREATE INDEX "Subscription_status_currentPeriodEnd_idx" ON "Subscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_midtransOrderId_key" ON "Invoice"("midtransOrderId");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_midtransOrderId_idx" ON "Invoice"("midtransOrderId");

-- CreateIndex
CREATE INDEX "Invoice_status_expiredAt_idx" ON "Invoice"("status", "expiredAt");

-- CreateIndex
CREATE INDEX "PaymentLog_invoiceId_idx" ON "PaymentLog"("invoiceId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "FcmToken_token_key" ON "FcmToken"("token");

-- CreateIndex
CREATE INDEX "LoginAttempt_identifier_createdAt_idx" ON "LoginAttempt"("identifier", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "FamilySpace" ADD CONSTRAINT "FamilySpace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLedger" ADD CONSTRAINT "TransactionLedger_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLedger" ADD CONSTRAINT "TransactionLedger_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcmToken" ADD CONSTRAINT "FcmToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcmToken" ADD CONSTRAINT "FcmToken_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

