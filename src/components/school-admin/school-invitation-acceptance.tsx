"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptSchoolInvitation } from "@/actions/school-admin";
import { logoutAction } from "@/actions/auth";

export default function SchoolInvitationAcceptance({
  token,
  schoolName,
  roleLabel,
  signedIn,
  canAccept,
  blockedReason,
}: {
  token: string;
  schoolName: string;
  roleLabel: string;
  signedIn: boolean;
  canAccept: boolean;
  blockedReason?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await acceptSchoolInvitation(new FormData(event.currentTarget));
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(result.data.redirectTo);
      router.refresh();
    } catch {
      setError("Undangan belum dapat diterima. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f4ee] px-4 py-10 text-[#243a32]">
      <section className="w-full max-w-lg rounded-2xl border border-[#dbe2d9] bg-[#fbfbf7] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#245b4a]">JOBEN · Undangan sekolah</p>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-[#20382f]">{schoolName}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6e7e75]">
          Undangan ini memberikan peran <strong className="text-[#344b41]">{roleLabel}</strong>. Penerimaan memakai akun JOBEN dengan email yang cocok dan membuat akses sekolah terpisah dari FamilySpace.
        </p>

        {blockedReason ? (
          <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-900">{blockedReason}</p>
        ) : canAccept ? (
          <form onSubmit={onSubmit} className="mt-6">
            <input type="hidden" name="token" value={token} />
            {error ? <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</p> : null}
            <button type="submit" disabled={pending} className="min-h-11 w-full rounded-lg bg-[#245b4a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b4a3b] disabled:cursor-wait disabled:opacity-60">
              {pending ? "Memproses undangan..." : "Terima undangan"}
            </button>
          </form>
        ) : signedIn ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm leading-relaxed text-amber-950">Akun yang sedang masuk tidak cocok dengan penerima undangan. Keluar, lalu masuk dengan akun yang memiliki email undangan.</p>
            <form action={logoutAction} className="mt-3">
              <button type="submit" className="text-sm font-semibold text-[#39745e] underline underline-offset-2">Keluar dan masuk dengan akun lain</button>
            </form>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-[#dce3dc] bg-[#f8f8f3] p-4">
            <p className="text-sm leading-relaxed text-[#5c7065]">Masuk terlebih dahulu dengan akun orang tua yang memiliki email penerima undangan. Setelah masuk, buka kembali tautan ini.</p>
            <Link href="/login" target="_blank" rel="noreferrer" className="mt-3 inline-flex font-semibold text-[#39745e] underline underline-offset-2">
              Buka login di tab baru
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}