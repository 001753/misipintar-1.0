import { createHash, randomBytes } from "node:crypto";

export function createSchoolInvitationToken() {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashSchoolInvitationToken(token),
  };
}

export function hashSchoolInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}