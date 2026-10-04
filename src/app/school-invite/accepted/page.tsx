import Link from "next/link";

export const metadata = { title: "Undangan diterima — JOBEN" };

export default function SchoolInvitationAcceptedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f4ee] px-4 py-10 text-[#243a32]">
      <section className="w-full max-w-lg rounded-2xl border border-[#dbe2d9] bg-[#fbfbf7] p-6 text-center shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#245b4a]">JOBEN · Undangan sekolah</p>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-[#20382f]">Undangan diterima</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6e7e75]">Akses sekolah sudah dicatat. Ruang kerja khusus guru belum tersedia pada tahap ini; data keluarga tetap terpisah.</p>
        <Link href="/login" className="mt-5 inline-flex font-semibold text-[#39745e] underline underline-offset-2">Kembali ke login</Link>
      </section>
    </main>
  );
}