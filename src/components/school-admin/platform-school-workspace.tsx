"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Building2, CirclePlus, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import {
  ActionNotice,
  EmptyState,
  Field,
  SectionHeading,
  StatusBadge,
  SubmitButton,
  handleActionSubmit,
  inputClass,
  useFormActions,
} from "./shared";
import type { FormAction, School } from "./types";

export type PlatformSchoolWorkspaceProps = {
  schools: School[];
  createSchool: FormAction;
};

export default function PlatformSchoolWorkspace({ schools, createSchool }: PlatformSchoolWorkspaceProps) {
  const { feedback, isPending, submit } = useFormActions();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"name" | "recent">("name");

  const filteredSchools = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id-ID");
    return schools
      .filter((school) => statusFilter === "ALL" || school.status === statusFilter)
      .filter((school) => !term || `${school.name} ${school.slug} ${school.timezone}`.toLocaleLowerCase("id-ID").includes(term))
      .sort((a, b) => sortOrder === "name" ? a.name.localeCompare(b.name, "id") : b.id.localeCompare(a.id));
  }, [schools, query, statusFilter, sortOrder]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    handleActionSubmit(event, "create-school", "Sekolah berhasil ditambahkan.", createSchool, submit, () => {
      form.reset();
      setFormOpen(false);
    });
  }

  const activeCount = schools.filter((school) => school.status === "ACTIVE").length;
  const reviewCount = schools.filter((school) => school.status === "PENDING_REVIEW").length;

  return (
    <main className="min-h-[100dvh] bg-[#f3f4ee] px-4 pb-12 pt-7 text-[#243a32] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1360px]">
        <header className="mb-8 flex flex-col gap-5 border-b border-[#dce2d9] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#245b4a] text-white"><Building2 aria-hidden="true" className="h-[18px] w-[18px]" /></span>
              <span className="text-sm font-black tracking-[0.14em] text-[#245b4a]">JOBEN</span>
              <span className="h-4 w-px bg-[#cbd5cc]" />
              <span className="text-xs font-semibold uppercase tracking-[0.13em] text-[#78857e]">Platform</span>
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9c654c]">Tenant dan akses</p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#20382f] sm:text-4xl">Sekolah terdaftar</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6e7e75]">
              Kelola ruang sekolah JOBEN. Data keluarga MisiPintar berada di konteks terpisah.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen((current) => !current)}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#245b4a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b4a3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548575] focus-visible:ring-offset-2"
          >
            <CirclePlus aria-hidden="true" className="h-4 w-4" /> Daftarkan sekolah
          </button>
        </header>

        {feedback.kind !== "idle" && feedback.action === "create-school" ? (
          <div className="mb-5"><ActionNotice feedback={feedback} /></div>
        ) : null}

        {formOpen ? (
          <section className="mb-7 rounded-2xl border border-[#cfdcd1] bg-[#eaf0e8] p-4 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9c654c]">Tenant baru</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#263e34]">Daftarkan sekolah</h2>
                <p className="mt-1 text-sm text-[#6c7c72]">Sekolah baru dibuat dengan status menunggu tinjauan.</p>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-[#ced9ce] bg-[#f8faf5] px-3 py-2 text-xs font-semibold text-[#5d7065] hover:bg-white">Tutup</button>
            </div>
            <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_0.8fr_1fr_auto] xl:items-end">
              <Field label="Nama sekolah" name="schoolName" required>
                <input id="schoolName" name="name" required className={inputClass} autoComplete="organization" placeholder="Contoh: TK Bintang Pagi" />
              </Field>
              <Field label="Alamat singkat" name="slug" required hint="Huruf kecil, angka, dan tanda hubung.">
                <input id="slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={inputClass} autoComplete="off" placeholder="tk-bintang-pagi" />
              </Field>
              <Field label="Zona waktu" name="timezone" required>
                <select id="timezone" name="timezone" required defaultValue="Asia/Jakarta" className={inputClass}>
                  <option value="Asia/Jakarta">WIB · Asia/Jakarta</option>
                  <option value="Asia/Makassar">WITA · Asia/Makassar</option>
                  <option value="Asia/Jayapura">WIT · Asia/Jayapura</option>
                </select>
              </Field>
              <SubmitButton pending={isPending && feedback.action === "create-school"} pendingLabel="Mendaftarkan...">Simpan sekolah</SubmitButton>
            </form>
          </section>
        ) : null}

        <section aria-label="Ringkasan tenant" className="mb-7 grid gap-3 sm:grid-cols-3">
          <PlatformMetric label="Total sekolah" value={schools.length} accent="green" />
          <PlatformMetric label="Sekolah aktif" value={activeCount} accent="sand" />
          <PlatformMetric label="Menunggu tinjauan" value={reviewCount} accent="coral" />
        </section>

        <section className="rounded-2xl border border-[#dbe2d9] bg-[#fbfbf7] p-4 shadow-[0_8px_24px_-22px_rgba(29,55,43,0.5)] sm:p-6">
          <div className="mb-5">
            <SectionHeading eyebrow="Indeks tenant" title="Daftar sekolah" description="Cari dan tinjau status tenant yang terdaftar di platform." count={filteredSchools.length} />
          </div>
          <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_160px]">
            <label className="relative block">
              <span className="sr-only">Cari sekolah</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#839087]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} pl-10`} placeholder="Cari nama, alamat, zona waktu" type="search" />
            </label>
            <label className="relative block">
              <span className="sr-only">Filter status sekolah</span>
              <SlidersHorizontal aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#839087]" />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={`${inputClass} pl-10`}>
                <option value="ALL">Semua status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="PENDING_REVIEW">Menunggu tinjauan</option>
                <option value="SUSPENDED">Ditangguhkan</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </label>
            <label className="sr-only" htmlFor="sortSchools">Urutkan sekolah</label>
            <select id="sortSchools" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "name" | "recent")} className={inputClass}>
              <option value="name">Urutkan: nama</option>
              <option value="recent">Urutkan: terbaru</option>
            </select>
          </div>

          {schools.length === 0 ? (
            <EmptyState title="Belum ada sekolah terdaftar" description="Daftarkan tenant pertama untuk mulai menyiapkan fondasi administrasi sekolah JOBEN." />
          ) : filteredSchools.length === 0 ? (
            <EmptyState title="Sekolah tidak ditemukan" description="Ubah kata pencarian atau filter status untuk melihat hasil lain." />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-[#e1e6df] md:block">
                <table className="w-full text-left">
                  <thead className="bg-[#f1f4ee] text-[10px] font-bold uppercase tracking-[0.13em] text-[#728178]">
                    <tr><th scope="col" className="px-4 py-3">Sekolah</th><th scope="col" className="px-4 py-3">Alamat singkat</th><th scope="col" className="px-4 py-3">Zona waktu</th><th scope="col" className="px-4 py-3">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8ece6]">
                    {filteredSchools.map((school) => (
                      <tr key={school.id} className="bg-[#fffefa] transition hover:bg-[#f8faf5]">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf1ea] text-[#39745e]"><Building2 aria-hidden="true" className="h-4 w-4" /></span>
                            <span className="font-semibold text-[#30473d]">{school.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-[#64766c]">{school.slug}</td>
                        <td className="px-4 py-4 text-sm text-[#64766c]">{timezoneLabel(school.timezone)}</td>
                        <td className="px-4 py-4"><StatusBadge status={school.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 md:hidden">
                {filteredSchools.map((school) => (
                  <article key={school.id} className="rounded-xl border border-[#e1e6df] bg-[#fffefa] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eaf1ea] text-[#39745e]"><Building2 aria-hidden="true" className="h-4 w-4" /></span>
                        <div className="min-w-0"><h3 className="truncate text-sm font-bold text-[#30473d]">{school.name}</h3><p className="mt-1 truncate font-mono text-xs text-[#7a887f]">{school.slug}</p></div>
                      </div>
                      <StatusBadge status={school.status} />
                    </div>
                    <p className="mt-3 border-t border-[#edf0eb] pt-3 text-xs text-[#64766c]">Zona waktu <span className="ml-1 font-semibold">{timezoneLabel(school.timezone)}</span></p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <footer className="mt-6 flex items-center gap-2 border-t border-[#dce2d9] pt-4 text-xs text-[#849088]">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-[#56816c]" />
          Pengelolaan tenant dibatasi untuk administrasi platform.
        </footer>
      </div>
    </main>
  );
}

function PlatformMetric({ label, value, accent }: { label: string; value: number; accent: "green" | "sand" | "coral" }) {
  const accents = {
    green: "bg-[#eaf1ea] text-[#39745e]",
    sand: "bg-[#f3efe4] text-[#927c45]",
    coral: "bg-[#f7ebe5] text-[#a85d42]",
  };
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#dbe2d9] bg-[#fbfbf7] px-4 py-4 shadow-[0_8px_24px_-22px_rgba(29,55,43,0.5)] sm:px-5">
      <div><p className="text-xs font-semibold text-[#7b8980]">{label}</p><p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#234d3e]">{value.toLocaleString("id-ID")}</p></div>
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${accents[accent]}`}><Building2 aria-hidden="true" className="h-4 w-4" /></span>
    </div>
  );
}

function timezoneLabel(timezone: string) {
  const labels: Record<string, string> = {
    "Asia/Jakarta": "WIB · Jakarta",
    "Asia/Makassar": "WITA · Makassar",
    "Asia/Jayapura": "WIT · Jayapura",
  };
  return labels[timezone] ?? timezone;
}