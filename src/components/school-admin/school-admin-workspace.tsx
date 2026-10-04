"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  GraduationCap,
  Plus,
  ShieldCheck,
  Users,
  UserRound,
} from "lucide-react";
import {
  ActionNotice,
  EmptyState,
  Field,
  getInvitationPath,
  InvitationLinkNotice,
  SectionHeading,
  StatusBadge,
  SubmitButton,
  handleActionSubmit,
  initials,
  inputClass,
  useFormActions,
} from "./shared";
import type { FormAction, Invitation, Member, School, SchoolClass, SchoolCounts, SchoolStudent } from "./types";

export type SchoolAdminWorkspaceProps = {
  school: School;
  counts: SchoolCounts;
  members: Member[];
  invitations: Invitation[];
  classes: SchoolClass[];
  students: SchoolStudent[];
  currentUserId: string;
  updateSchool: FormAction;
  addMember: FormAction;
  revokeInvitation: FormAction;
  setMemberStatus: FormAction;
  createClass: FormAction;
  createStudent: FormAction;
  setStudentStatus: FormAction;
};

type DialogName = "member" | "class" | "student" | null;

const roleOptions = [
  ["ADMIN", "Admin sekolah"],
  ["PRINCIPAL", "Kepala sekolah"],
  ["TEACHER", "Guru"],
  ["HOMEROOM_TEACHER", "Wali kelas"],
];

export default function SchoolAdminWorkspace({
  school,
  counts,
  members,
  invitations,
  classes,
  students,
  currentUserId,
  updateSchool,
  addMember,
  revokeInvitation,
  setMemberStatus,
  createClass,
  createStudent,
  setStudentStatus,
}: SchoolAdminWorkspaceProps) {
  const { feedback, isPending, submit } = useFormActions();
  const [dialog, setDialog] = useState<DialogName>(null);
  const [schoolSaved, setSchoolSaved] = useState(false);
  const memberInvitePath = feedback.kind === "success" && feedback.action === "member"
    ? getInvitationPath(feedback.data)
    : null;

  function onSubmit(
    event: FormEvent<HTMLFormElement>,
    action: string,
    message: string,
    callback: FormAction,
    reset?: boolean,
    closeDialog = false,
    confirmMessage?: string,
  ) {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }
    const form = event.currentTarget;
    handleActionSubmit(event, action, message, callback, submit, () => {
      if (reset) form.reset();
      if (closeDialog) setDialog(null);
      if (action === "school") setSchoolSaved(true);
    });
  }

  return (
    <div className="min-h-[100dvh] bg-[#f3f4ee] text-[#243a32]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-1 bg-[#b96347]" aria-hidden="true" />
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-7 sm:px-7 lg:px-10">
        <header className="mb-7 flex flex-col gap-5 border-b border-[#dce2d9] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#245b4a] text-white">
                <Building2 aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
              <span className="text-sm font-black tracking-[0.14em] text-[#245b4a]">JOBEN</span>
              <span className="h-4 w-px bg-[#cbd5cc]" />
              <span className="text-xs font-semibold uppercase tracking-[0.13em] text-[#78857e]">Administrasi sekolah</span>
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9c654c]">Ruang kerja sekolah</p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#20382f] sm:text-4xl">
              {school.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6e7e75]">
              Kelola staf, kelas, dan data siswa dalam satu ruang sekolah. Akun keluarga MisiPintar tetap terpisah.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start rounded-xl border border-[#d9e1d8] bg-[#fafaf6] px-3.5 py-3 md:self-auto">
            <ShieldCheck aria-hidden="true" className="h-5 w-5 text-[#39745e]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7c8b81]">Status sekolah</p>
              <div className="mt-1"><StatusBadge status={school.status} /></div>
            </div>
          </div>
          <a
            href="/school-admin"
            className="text-xs font-semibold text-[#39745e] underline decoration-[#a9cabb] underline-offset-2 hover:text-[#205943]"
          >
            Pilih sekolah
          </a>
        </header>

        {school.status === "PENDING_REVIEW" ? (
          <aside className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
            Sekolah sedang menunggu tinjauan Platform Admin. Profil, staf, dan kelas dapat disiapkan; roster siswa baru tersedia setelah sekolah disetujui.
          </aside>
        ) : null}

        <section aria-label="Ringkasan sekolah" className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryTile icon={<Users className="h-4 w-4" />} label="Anggota staf" value={counts.members} note="Akses sekolah" />
          <SummaryTile icon={<BookOpen className="h-4 w-4" />} label="Kelas" value={counts.classes} note="Tahun ajaran berjalan" />
          <SummaryTile icon={<GraduationCap className="h-4 w-4" />} label="Siswa" value={counts.students} note="Catatan di sekolah" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
          <section className="rounded-2xl border border-[#dbe2d9] bg-[#fbfbf7] p-4 shadow-[0_8px_24px_-22px_rgba(29,55,43,0.5)] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeading
                eyebrow="01 / Akses"
                title="Staf sekolah"
                description="Kelola siapa yang dapat masuk ke ruang kerja sekolah ini."
                count={members.length}
              />
              <button
                type="button"
                onClick={() => setDialog("member")}
                className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-[#245b4a] px-3.5 py-2 text-sm font-semibold text-[#245b4a] transition hover:bg-[#edf3ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548575]"
              >
                <Plus aria-hidden="true" className="h-4 w-4" /> Undang staf
              </button>
            </div>
            {feedback.kind === "error" && feedback.action === "member" ? <div className="mb-4"><ActionNotice feedback={feedback} /></div> : null}
            {feedback.kind === "success" && feedback.action === "member" ? <div className="mb-4"><ActionNotice feedback={feedback} /></div> : null}
            {memberInvitePath ? <InvitationLinkNotice path={memberInvitePath} /> : null}
            {members.length === 0 ? (
              <EmptyState title="Belum ada staf aktif" description="Buat undangan untuk memberikan akses setelah calon anggota masuk dengan akun yang sesuai." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#e1e6df]">
                <div className="hidden grid-cols-[minmax(180px,1fr)_minmax(160px,1fr)_130px_132px] gap-4 bg-[#f1f4ee] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#728178] md:grid">
                  <span>Nama anggota</span><span>Email</span><span>Peran</span><span>Status / aksi</span>
                </div>
                <div className="divide-y divide-[#e8ece6]">
                  {members.map((member) => (
                    <article key={member.id} className="grid gap-3 bg-[#fffefa] px-4 py-4 md:grid-cols-[minmax(180px,1fr)_minmax(160px,1fr)_130px_132px] md:items-center md:gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e6eee6] text-xs font-bold text-[#3c6d58]">{initials(member.name)}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#30473d]">{member.name}</p>
                          <p className="mt-0.5 truncate text-xs text-[#839087] md:hidden">{member.email}</p>
                        </div>
                      </div>
                      <p className="hidden truncate text-sm text-[#64766c] md:block">{member.email}</p>
                      <p className="text-xs font-semibold text-[#556a60] md:text-sm">{formatRole(member.role)}</p>
                      <div className="flex items-center justify-between gap-2 md:block">
                        <StatusBadge status={member.status} />
                        {member.status === "ACTIVE" && member.role !== "OWNER" && member.userId !== currentUserId ? (
                          <form
                            onSubmit={(event) => onSubmit(event, `member-${member.id}`, "Status anggota diperbarui.", setMemberStatus, false, false, "Tangguhkan akses anggota ini ke sekolah?")}
                            className="md:mt-2"
                          >
                            <input type="hidden" name="schoolId" value={school.id} />
                            <input type="hidden" name="memberId" value={member.id} />
                            <input type="hidden" name="status" value="SUSPENDED" />
                            <button type="submit" disabled={isPending} className="text-xs font-semibold text-[#a4513d] underline decoration-[#d8afa3] underline-offset-2 hover:text-[#833e2f] disabled:opacity-50">Tangguhkan</button>
                          </form>
                        ) : member.status === "SUSPENDED" && member.role !== "OWNER" ? (
                          <form
                            onSubmit={(event) => onSubmit(event, `member-${member.id}`, "Status anggota diperbarui.", setMemberStatus)}
                            className="md:mt-2"
                          >
                            <input type="hidden" name="schoolId" value={school.id} />
                            <input type="hidden" name="memberId" value={member.id} />
                            <input type="hidden" name="status" value="ACTIVE" />
                            <button type="submit" disabled={isPending} className="text-xs font-semibold text-[#32745b] underline decoration-[#a9cabb] underline-offset-2 hover:text-[#205943] disabled:opacity-50">Aktifkan</button>
                          </form>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
            {invitations.length > 0 ? (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-bold text-[#344b41]">Undangan menunggu</h3>
                <div className="space-y-2">
                  {invitations.map((invitation) => {
                    return (
                      <article key={invitation.id} className="flex flex-col gap-3 rounded-xl border border-[#e2e8e1] bg-[#fffefa] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#30473d]">{invitation.email}</p>
                          <p className="mt-1 text-xs text-[#748279]">
                            {formatRole(invitation.role)} · {invitation.expired ? "Kedaluwarsa" : `Berlaku sampai ${formatDate(invitation.expiresAt)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={invitation.expired ? "INACTIVE" : "PENDING"} />
                          <form onSubmit={(event) => onSubmit(event, `invite-${invitation.id}`, "Undangan dicabut.", revokeInvitation, false, false, "Cabut tautan undangan ini? Penerima tidak dapat menggunakannya lagi.")}>
                            <input type="hidden" name="schoolId" value={school.id} />
                            <input type="hidden" name="invitationId" value={invitation.id} />
                            <button type="submit" disabled={isPending} className="text-xs font-semibold text-[#a4513d] underline underline-offset-2 disabled:opacity-50">Cabut</button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {feedback.kind !== "idle" && (feedback.action.startsWith("member-") || feedback.action.startsWith("invite-")) ? (
              <div className="mt-4"><ActionNotice feedback={feedback} /></div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[#dbe2d9] bg-[#fbfbf7] p-4 shadow-[0_8px_24px_-22px_rgba(29,55,43,0.5)] sm:p-6">
            <SectionHeading eyebrow="Pengaturan" title="Profil sekolah" description="Pastikan nama dan zona waktu sekolah selalu sesuai." />
            <form className="mt-5 space-y-4" onSubmit={(event) => onSubmit(event, "school", "Profil sekolah berhasil diperbarui.", updateSchool)}>
              <input type="hidden" name="schoolId" value={school.id} />
              <Field label="Nama sekolah" name="name" required>
                <input id="name" name="name" required defaultValue={school.name} className={inputClass} autoComplete="organization" />
              </Field>
              <Field label="Alamat singkat" name="slug" required hint="Dipakai sebagai identitas alamat sekolah.">
                <input id="slug" name="slug" required defaultValue={school.slug} className={inputClass} autoComplete="off" />
              </Field>
              <Field label="Zona waktu" name="timezone" required>
                <select id="timezone" name="timezone" required defaultValue={school.timezone} className={inputClass}>
                  {[
                    ["Asia/Jakarta", "WIB · Asia/Jakarta"],
                    ["Asia/Makassar", "WITA · Asia/Makassar"],
                    ["Asia/Jayapura", "WIT · Asia/Jayapura"],
                  ].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              {feedback.kind !== "idle" && feedback.action === "school" ? <ActionNotice feedback={feedback} /> : null}
              {schoolSaved && feedback.kind === "success" && feedback.action === "school" ? (
                <p className="flex items-center gap-1.5 text-xs text-[#39745e]"><Check aria-hidden="true" className="h-3.5 w-3.5" /> Perubahan profil sudah tersimpan.</p>
              ) : null}
              <SubmitButton pending={isPending && feedback.kind !== "idle" && feedback.action === "school"} pendingLabel="Menyimpan profil...">Simpan profil</SubmitButton>
            </form>
          </section>
        </div>

        <section className="mt-7 rounded-2xl border border-[#dbe2d9] bg-[#fbfbf7] p-4 shadow-[0_8px_24px_-22px_rgba(29,55,43,0.5)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeading eyebrow="02 / Roster" title="Kelas dan siswa" description="Pantau susunan kelas dan catatan siswa tanpa mencampur data akun keluarga." count={classes.length + students.length} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setDialog("class")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d4dfd5] bg-[#fffefa] px-3.5 py-2 text-sm font-semibold text-[#365f4d] transition hover:bg-[#f0f5ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548575]">
                <Plus aria-hidden="true" className="h-4 w-4" /> Buat kelas
              </button>
              {school.status === "ACTIVE" ? (
                <button type="button" onClick={() => setDialog("student")} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#b96347] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#a85239] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b96347] focus-visible:ring-offset-2">
                  <Plus aria-hidden="true" className="h-4 w-4" /> Tambah siswa
                </button>
              ) : null}
            </div>
          </div>

          {(feedback.kind === "error" || feedback.kind === "success") && ["class", "student"].includes(feedback.action) ? <div className="mb-4"><ActionNotice feedback={feedback} /></div> : null}
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#344b41]">Daftar kelas</h3>
                <span className="text-xs text-[#839087]">{classes.length} kelas</span>
              </div>
              {classes.length === 0 ? (
                <EmptyState title="Belum ada kelas" description="Buat kelas terlebih dahulu untuk mulai menyusun roster siswa." />
              ) : (
                <div className="space-y-2">
                  {classes.map((item) => (
                    <article key={item.id} className="flex items-center gap-3 rounded-xl border border-[#e2e8e1] bg-[#fffefa] p-3.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf1ea] text-[#3c6d58]"><BookOpen aria-hidden="true" className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h4 className="truncate text-sm font-bold text-[#31483e]">{item.name}</h4>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-1 text-xs text-[#7b8980]">{item.grade} <span aria-hidden="true">·</span> Tahun ajaran {item.academicYear}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-lg font-semibold tabular-nums text-[#365e4d]">{item.studentCount}</p>
                        <p className="text-[10px] text-[#839087]">siswa</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#344b41]">Catatan siswa</h3>
                <span className="text-xs text-[#839087]">{students.length} siswa</span>
              </div>
              {students.length === 0 ? (
                <EmptyState title="Roster masih kosong" description="Tambahkan catatan siswa. Data ini terpisah dari akun keluarga MisiPintar." />
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#e1e6df]">
                  <div className="hidden grid-cols-[minmax(160px,1fr)_90px_110px_112px] gap-3 bg-[#f1f4ee] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#728178] sm:grid">
                    <span>Nama tampilan</span><span>Kode lokal</span><span>Kelas / tahun</span><span>Status</span>
                  </div>
                  <div className="divide-y divide-[#e8ece6]">
                    {students.map((student) => (
                      <article key={student.id} className="grid gap-2 bg-[#fffefa] px-4 py-3.5 sm:grid-cols-[minmax(160px,1fr)_90px_110px_112px] sm:items-center sm:gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f5ece5] text-[10px] font-bold text-[#a85d42]">{initials(student.displayName)}</span>
                          <p className="truncate text-sm font-semibold text-[#31483e]">{student.displayName}</p>
                        </div>
                        <p className="pl-10 font-mono text-xs text-[#748279] sm:pl-0">{student.localCode || "—"}</p>
                        <p className="pl-10 text-xs text-[#748279] sm:pl-0">{student.className || "Belum ditempatkan"}{student.academicYear ? ` · ${student.academicYear}` : ""}</p>
                        <div className="flex items-center justify-between gap-2 pl-10 sm:pl-0">
                          <StatusBadge status={student.status} />
                          {student.status === "ACTIVE" ? (
                            <StudentStatusForm schoolId={school.id} studentId={student.id} nextStatus="INACTIVE" pending={isPending} onSubmit={(event) => onSubmit(event, `student-${student.id}`, "Status siswa diperbarui.", setStudentStatus, false, false, "Nonaktifkan siswa dan akhiri enrollment aktifnya?")} />
                          ) : student.status === "INACTIVE" ? (
                            <StudentStatusForm schoolId={school.id} studentId={student.id} nextStatus="ACTIVE" pending={isPending} onSubmit={(event) => onSubmit(event, `student-${student.id}`, "Status siswa diperbarui.", setStudentStatus)} />
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-2 border-t border-[#dce2d9] pt-4 text-xs text-[#849088] sm:flex-row sm:items-center sm:justify-between">
          <p>Data sekolah dibatasi untuk anggota yang memiliki akses.</p>
          <p className="flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-[#56816c]" /> Ruang sekolah JOBEN</p>
        </footer>
      </main>

      {dialog ? (
        <DialogShell title={dialogTitle(dialog)} onClose={() => setDialog(null)}>
          {dialog === "member" ? (
            <form className="space-y-4" onSubmit={(event) => onSubmit(event, "member", "Undangan staf berhasil dibuat.", addMember, true, true)}>
              <input type="hidden" name="schoolId" value={school.id} />
              <Field label="Email akun staf" name="memberEmail" required hint="Akun harus sudah terdaftar. JOBEN tidak mengirim email; tautan undangan perlu dibagikan melalui saluran yang aman."><input id="memberEmail" name="email" type="email" required className={inputClass} autoComplete="email" /></Field>
              <Field label="Peran di sekolah" name="role" required>
                <select id="role" name="role" required defaultValue="" className={inputClass}>
                  <option value="" disabled>Pilih peran</option>
                  {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              {feedback.kind !== "idle" && feedback.action === "member" ? <ActionNotice feedback={feedback} /> : null}
              <ModalActions pending={isPending && feedback.kind !== "idle" && feedback.action === "member"} onCancel={() => setDialog(null)} submitLabel="Buat undangan" pendingLabel="Membuat tautan..." />
            </form>
          ) : null}
          {dialog === "class" ? (
            <form className="space-y-4" onSubmit={(event) => onSubmit(event, "class", "Kelas berhasil dibuat.", createClass, true, true)}>
              <Field label="Nama kelas" name="className" required><input id="className" name="name" required className={inputClass} placeholder="Contoh: Kelas Melati" /></Field>
              <Field label="Tingkat" name="grade" required><input id="grade" name="grade" required className={inputClass} placeholder="Contoh: TK B atau Kelas 1" /></Field>
              <Field label="Tahun ajaran" name="academicYear" required><input id="academicYear" name="academicYear" required className={inputClass} placeholder="Contoh: 2026/2027" /></Field>
              <input type="hidden" name="schoolId" value={school.id} />
              {feedback.kind !== "idle" && feedback.action === "class" ? <ActionNotice feedback={feedback} /> : null}
              <ModalActions pending={isPending && feedback.kind !== "idle" && feedback.action === "class"} onCancel={() => setDialog(null)} submitLabel="Buat kelas" pendingLabel="Membuat kelas..." />
            </form>
          ) : null}
          {dialog === "student" ? (
            <form className="space-y-4" onSubmit={(event) => onSubmit(event, "student", "Catatan siswa berhasil ditambahkan.", createStudent, true, true)}>
              <Field label="Nama tampilan siswa" name="displayName" required hint="Gunakan nama yang dipakai di lingkungan sekolah.">
                <input id="displayName" name="displayName" required className={inputClass} autoComplete="off" />
              </Field>
              <Field label="Kode siswa lokal" name="localCode" hint="Opsional. Hindari nomor identitas pribadi.">
                <input id="localCode" name="localCode" className={inputClass} autoComplete="off" />
              </Field>
              <Field label="Kelas" name="classId" required>
                <select id="classId" name="classId" required defaultValue="" className={inputClass}>
                  <option value="" disabled>Pilih kelas</option>
                  {classes.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.name} · {item.academicYear}</option>)}
                </select>
              </Field>
              {classes.every((item) => item.status !== "ACTIVE") ? <p className="text-xs text-[#a4513d]">Buat kelas aktif terlebih dahulu sebelum menambahkan siswa.</p> : null}
              <input type="hidden" name="schoolId" value={school.id} />
              {feedback.kind !== "idle" && feedback.action === "student" ? <ActionNotice feedback={feedback} /> : null}
              <ModalActions pending={isPending && feedback.kind !== "idle" && feedback.action === "student"} onCancel={() => setDialog(null)} submitLabel="Simpan siswa" pendingLabel="Menyimpan siswa..." disabled={school.status !== "ACTIVE" || classes.every((item) => item.status !== "ACTIVE")} />
            </form>
          ) : null}
        </DialogShell>
      ) : null}
    </div>
  );
}

function SummaryTile({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number; note: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#dbe2d9] bg-[#fbfbf7] px-4 py-4 shadow-[0_8px_24px_-22px_rgba(29,55,43,0.5)] sm:px-5">
      <div className="absolute right-0 top-0 h-20 w-20 translate-x-5 -translate-y-8 rounded-full border-[14px] border-[#e9eee7]" aria-hidden="true" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#7b8980]">{label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight tabular-nums text-[#234d3e]">{value.toLocaleString("id-ID")}</p>
          <p className="mt-1 text-[11px] text-[#9aa39b]">{note}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf1ea] text-[#3d745d]">{icon}</span>
      </div>
    </div>
  );
}

function StudentStatusForm({
  schoolId,
  studentId,
  nextStatus,
  pending,
  onSubmit,
}: {
  schoolId: string;
  studentId: string;
  nextStatus: string;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="status" value={nextStatus} />
      <button type="submit" disabled={pending} className="whitespace-nowrap text-[11px] font-semibold text-[#a4513d] underline decoration-[#d8afa3] underline-offset-2 hover:text-[#833e2f] disabled:opacity-50">
        {nextStatus === "ACTIVE" ? "Aktifkan" : "Nonaktifkan"}
      </button>
    </form>
  );
}

function DialogShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17251f]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={title} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-[#d7dfd6] bg-[#fbfbf7] p-5 shadow-[0_24px_80px_-25px_rgba(14,32,24,0.42)] sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9c654c]">Pengelolaan sekolah</p><h2 className="mt-1 font-serif text-2xl font-semibold text-[#263e34]">{title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Tutup formulir" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dce3dc] text-[#65776d] hover:bg-[#eef2ec]"><ChevronDown aria-hidden="true" className="h-4 w-4 rotate-180" /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function ModalActions({
  pending,
  onCancel,
  submitLabel,
  pendingLabel,
  disabled = false,
}: {
  pending: boolean;
  onCancel: () => void;
  submitLabel: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-[#e5e9e2] pt-4 sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} className="min-h-10 rounded-lg border border-[#d7dfd7] px-4 py-2 text-sm font-semibold text-[#5d7065] hover:bg-[#f1f4ef]">Batal</button>
      <SubmitButton pending={pending} pendingLabel={pendingLabel} className="sm:min-w-36">{submitLabel}</SubmitButton>
      {disabled ? <span className="sr-only">Tombol simpan dinonaktifkan karena belum ada kelas.</span> : null}
    </div>
  );
}

function dialogTitle(dialog: Exclude<DialogName, null>) {
  if (dialog === "member") return "Tambah anggota staf";
  if (dialog === "class") return "Buat kelas";
  return "Tambah catatan siswa";
}

function formatRole(role: string) {
  const labels: Record<string, string> = {
    SCHOOL_ADMIN: "Admin sekolah",
    ADMIN: "Admin sekolah",
    OWNER: "Pemilik sekolah",
    PRINCIPAL: "Kepala sekolah",
    TEACHER: "Guru",
    HOMEROOM_TEACHER: "Wali kelas",
  };
  return labels[role] ?? role.replaceAll("_", " ");
}