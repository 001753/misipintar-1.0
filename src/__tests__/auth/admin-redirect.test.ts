import { describe, expect, it } from "vitest";
import { getAdminLandingPath } from "@/lib/auth/admin-redirect";

describe("getAdminLandingPath", () => {
  it("sends Platform Admin to the platform workspace", () => {
    expect(getAdminLandingPath("SUPER_ADMIN", [])).toBe("/superadmin");
  });

  it("opens a single non-suspended school directly", () => {
    expect(getAdminLandingPath("PARENT", [{ slug: "bintang-pagi", status: "PENDING_REVIEW" }]))
      .toBe("/school-admin/bintang-pagi");
  });

  it("uses the school picker for multiple or suspended schools", () => {
    expect(getAdminLandingPath("PARENT", [
      { slug: "bintang-pagi", status: "ACTIVE" },
      { slug: "melati", status: "ACTIVE" },
    ])).toBe("/school-admin");
    expect(getAdminLandingPath("PARENT", [{ slug: "melati", status: "SUSPENDED" }]))
      .toBe("/school-admin");
  });

  it("does not grant admin landing access to users without manager role or membership", () => {
    expect(getAdminLandingPath("PARENT", [])).toBeNull();
    expect(getAdminLandingPath("CHILD", [{ slug: "melati", status: "ACTIVE" }])).toBeNull();
  });
});