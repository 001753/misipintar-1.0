type SchoolContext = { slug: string; status: string };

export function getAdminLandingPath(role: string, schools: SchoolContext[]): string | null {
  if (role === "SUPER_ADMIN") return "/superadmin";
  if (role !== "PARENT" || schools.length === 0) return null;
  if (schools.length === 1 && schools[0].status !== "SUSPENDED") {
    return `/school-admin/${schools[0].slug}`;
  }
  return "/school-admin";
}