-- JOBEN Phase 1: additive school tenant, staff, class and roster foundation.
-- FamilySpace, Child, tasks, ledger and family billing data are untouched.

CREATE TYPE "SchoolStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "SchoolRole" AS ENUM ('OWNER', 'ADMIN', 'PRINCIPAL', 'TEACHER', 'HOMEROOM_TEACHER');
CREATE TYPE "SchoolMembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "SchoolInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
CREATE TYPE "SchoolClassStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "SchoolStudentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "SchoolEnrollmentStatus" AS ENUM ('ACTIVE', 'ENDED');

CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "status" "SchoolStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolMembership" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SchoolRole" NOT NULL,
    "status" "SchoolMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchoolMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolInvitation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "SchoolRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "SchoolInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchoolInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" "SchoolClassStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolStudent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "localCode" TEXT,
    "status" "SchoolStudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchoolStudent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolEnrollment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "status" "SchoolEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    CONSTRAINT "SchoolEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolClassTeacher" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schoolClassId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchoolClassTeacher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");
CREATE INDEX "School_status_createdAt_idx" ON "School"("status", "createdAt");

CREATE UNIQUE INDEX "SchoolMembership_schoolId_userId_key" ON "SchoolMembership"("schoolId", "userId");
CREATE INDEX "SchoolMembership_userId_status_idx" ON "SchoolMembership"("userId", "status");
CREATE INDEX "SchoolMembership_schoolId_role_status_idx" ON "SchoolMembership"("schoolId", "role", "status");

CREATE UNIQUE INDEX "SchoolInvitation_tokenHash_key" ON "SchoolInvitation"("tokenHash");
CREATE UNIQUE INDEX "SchoolInvitation_pending_school_email_key"
    ON "SchoolInvitation"("schoolId", lower("email"))
    WHERE "status" = 'PENDING';
CREATE INDEX "SchoolInvitation_schoolId_status_expiresAt_idx" ON "SchoolInvitation"("schoolId", "status", "expiresAt");
CREATE INDEX "SchoolInvitation_email_status_idx" ON "SchoolInvitation"("email", "status");

CREATE UNIQUE INDEX "SchoolClass_schoolId_id_key" ON "SchoolClass"("schoolId", "id");
CREATE UNIQUE INDEX "SchoolClass_schoolId_name_academicYear_key" ON "SchoolClass"("schoolId", "name", "academicYear");
CREATE INDEX "SchoolClass_schoolId_status_academicYear_idx" ON "SchoolClass"("schoolId", "status", "academicYear");

CREATE UNIQUE INDEX "SchoolStudent_schoolId_id_key" ON "SchoolStudent"("schoolId", "id");
CREATE UNIQUE INDEX "SchoolStudent_localCode_key"
    ON "SchoolStudent"("schoolId", "localCode")
    WHERE "localCode" IS NOT NULL;
CREATE INDEX "SchoolStudent_schoolId_status_createdAt_idx" ON "SchoolStudent"("schoolId", "status", "createdAt");

CREATE UNIQUE INDEX "SchoolEnrollment_one_active_per_student_key"
    ON "SchoolEnrollment"("schoolId", "studentId")
    WHERE "status" = 'ACTIVE';
CREATE INDEX "SchoolEnrollment_schoolId_classId_status_idx" ON "SchoolEnrollment"("schoolId", "classId", "status");
CREATE INDEX "SchoolEnrollment_schoolId_studentId_startedAt_idx" ON "SchoolEnrollment"("schoolId", "studentId", "startedAt" DESC);

CREATE UNIQUE INDEX "SchoolClassTeacher_schoolId_schoolClassId_userId_key"
    ON "SchoolClassTeacher"("schoolId", "schoolClassId", "userId");
CREATE INDEX "SchoolClassTeacher_schoolId_userId_idx" ON "SchoolClassTeacher"("schoolId", "userId");

ALTER TABLE "SchoolMembership"
    ADD CONSTRAINT "SchoolMembership_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolMembership"
    ADD CONSTRAINT "SchoolMembership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SchoolInvitation"
    ADD CONSTRAINT "SchoolInvitation_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolInvitation"
    ADD CONSTRAINT "SchoolInvitation_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolInvitation"
    ADD CONSTRAINT "SchoolInvitation_acceptedById_fkey"
    FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SchoolClass"
    ADD CONSTRAINT "SchoolClass_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolStudent"
    ADD CONSTRAINT "SchoolStudent_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolEnrollment"
    ADD CONSTRAINT "SchoolEnrollment_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolEnrollment"
    ADD CONSTRAINT "SchoolEnrollment_schoolId_studentId_fkey"
    FOREIGN KEY ("schoolId", "studentId") REFERENCES "SchoolStudent"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolEnrollment"
    ADD CONSTRAINT "SchoolEnrollment_schoolId_classId_fkey"
    FOREIGN KEY ("schoolId", "classId") REFERENCES "SchoolClass"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SchoolClassTeacher"
    ADD CONSTRAINT "SchoolClassTeacher_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolClassTeacher"
    ADD CONSTRAINT "SchoolClassTeacher_schoolId_schoolClassId_fkey"
    FOREIGN KEY ("schoolId", "schoolClassId") REFERENCES "SchoolClass"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolClassTeacher"
    ADD CONSTRAINT "SchoolClassTeacher_schoolId_userId_fkey"
    FOREIGN KEY ("schoolId", "userId") REFERENCES "SchoolMembership"("schoolId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;