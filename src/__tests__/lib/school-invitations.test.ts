import { describe, expect, it } from "vitest";
import { createSchoolInvitationToken, hashSchoolInvitationToken } from "@/lib/school-invitations";

describe("school invitation tokens", () => {
  it("creates high-entropy URL-safe tokens and stores only their SHA-256 digest", () => {
    const first = createSchoolInvitationToken();
    const second = createSchoolInvitationToken();

    expect(first.token).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).not.toBe(first.token);
    expect(hashSchoolInvitationToken(first.token)).toBe(first.tokenHash);
    expect(second.token).not.toBe(first.token);
  });
});