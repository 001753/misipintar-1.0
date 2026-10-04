import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/school-admin/shared";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pilih sekolah — JOBEN" };

export default async function SchoolAdminLandingPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role === "CHILD") redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/superadmin/schools");

  const memberships = await prisma.schoolMembership.findMany({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      role: { in: ["OWNER", "ADMIN"] },
    },
    select: {
      school: { select: { id: true, name: true, slug: true, status: true, timezone: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) redirect("/login");
  if (memberships.length === 1 && memberships[0].school.status !== "SUSPENDED") {
    redirect(`/school-admin/${memberships[0].school.slug}`);
  }

  return (
    <main className="min-h-screen bg-[#f3f4ee] px-4 py-10 text-[#243a32] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9c654c]">JOBEN · Administrasi sekolah</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#20382f]">Pilih sekolah</h1>
        <p className="mt-2 text-sm text-[#6e7e75]">Pilih ruang sekolah yang ingin Anda kelola. Akses mengikuti membership aktif Anda.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {memberships.map(({ school }) => (
            school.status === "SUSPENDED" ? (
              <article key={school.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-xl font-semibold text-[#5b342c]">{school.name}</h2>
                  <StatusBadge status={school.status} />
                </div>
                <p className="mt-2 text-sm text-[#795a52]">Akses pengelolaan sekolah ini sedang ditangguhkan.</p>
              </article>
            ) : (
              <Link
                key={school.id}
                href={`/school-admin/${school.slug}`}
                className="rounded-2xl border border-[#dbe2d9] bg-[#fbfbf7] p-5 transition hover:border-[#9fbdab] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548575]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-xl font-semibold text-[#263e34]">{school.name}</h2>
                  <StatusBadge status={school.status} />
                </div>
                <p className="mt-2 text-sm text-[#6e7e75]">{school.slug} · {school.timezone}</p>
                <span className="mt-5 inline-flex text-sm font-semibold text-[#39745e]">Buka sekolah <span className="ml-1" aria-hidden="true">→</span></span>
              </Link>
            )
          ))}
        </div>
      </div>
    </main>
  );
}