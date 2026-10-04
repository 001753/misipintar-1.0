import SchoolInvitationAcceptance from "@/components/school-admin/school-invitation-acceptance";
import { auth } from "@/lib/auth/config";
import { hashSchoolInvitationToken } from "@/lib/school-invitations";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Undangan sekolah — JOBEN",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function SchoolInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) return <InvalidInvitation />;

  const invitation = await prisma.schoolInvitation.findUnique({
    where: { tokenHash: hashSchoolInvitationToken(token) },
    select: {
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      school: { select: { name: true, status: true } },
    },
  });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date()) {
    return <InvalidInvitation />;
  }

  const session = await auth();
  const signedIn = Boolean(session?.user?.id);
  const canAccept = session?.user?.role === "PARENT"
    && Boolean(session.user.email)
    && session.user.email!.trim().toLowerCase() === invitation.email.trim().toLowerCase();
  const blockedReason = invitation.school.status === "SUSPENDED"
    ? "Sekolah sedang ditangguhkan. Undangan ini belum dapat diterima."
    : undefined;

  return (
    <SchoolInvitationAcceptance
      token={token}
      schoolName={invitation.school.name}
      roleLabel={roleLabel(invitation.role)}
      signedIn={signedIn}
      canAccept={canAccept}
      blockedReason={blockedReason}
    />
  );
}

function InvalidInvitation() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f4ee] px-4 py-10 text-[#243a32]">
      <section className="w-full max-w-lg rounded-2xl border border-[#dbe2d9] bg-[#fbfbf7] p-6 text-center shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#245b4a]">JOBEN · Undangan sekolah</p>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-[#20382f]">Undangan tidak tersedia</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6e7e75]">Tautan mungkin sudah digunakan, dicabut, atau kedaluwarsa. Minta pengelola sekolah membuat undangan baru.</p>
      </section>
    </main>
  );
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    OWNER: "Pemilik sekolah",
    ADMIN: "Admin sekolah",
    PRINCIPAL: "Kepala sekolah",
    TEACHER: "Guru",
    HOMEROOM_TEACHER: "Wali kelas",
  };
  return labels[role] ?? "Staf sekolah";
}