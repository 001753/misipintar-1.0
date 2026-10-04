# JOBEN — Roadmap Implementasi dan Audit terhadap PRD

**Versi:** 1.0  
**Tanggal audit:** 4 Oktober 2026  
**Status:** Draft — audit kode dan roadmap untuk review  
**Acuan:** `doc/JOBEN-PRD.md` versi 1.0 dan implementasi yang saat ini ada di repositori

> Dokumen ini memisahkan bukti implementasi dari rencana. Fitur hanya berstatus **SELESAI** bila seluruh alur frontend-backend, otorisasi, state, audit/privacy, dan tes yang relevan memenuhi Definition of Done PRD. Tanggal rilis, pemilik, kapasitas tim, dan estimasi belum diberikan; dokumen ini tidak mengarangnya.

## Ringkasan status

| Tahap PRD | Status | Ringkasan |
|---|---|---|
| Tahap 0 — Review dan kesiapan | **SEBAGIAN** | PRD ada dan fondasi database development telah diperiksa, tetapi keputusan hukum/bisnis dan persetujuan PRD belum tercatat. |
| Tahap 1 — Fondasi tenant dan akses | **SEBAGIAN** | Model tenant, login admin, provisioning Platform Admin, undangan, profil, kelas, dan roster manual sudah ada. Assignment guru, alur pendaftaran owner, beberapa kontrol/tes otorisasi, dan bukti kesiapan operasional belum lengkap. |
| Tahap 2 — Pengalaman sekolah, keluarga, dan anak | **BELUM DIMULAI** | Belum ada import CSV, verifikasi wali/consent, dashboard guru-orang tua-anak JOBEN, integrasi misi sekolah, atau komunikasi sekolah-keluarga. |
| Tahap 3 — Evidence dan perkembangan | **BELUM DIMULAI** | Belum ada model kompetensi, observasi, evidence, passport, koreksi berversi, atau laporan perkembangan JOBEN. |
| Tahap 4 — Langganan dan billing sekolah | **BELUM DIMULAI** | Tidak ada subscription/invoice sekolah. Checkout DOKU, Midtrans lama, dan QRIS yang ada adalah milik FamilySpace dan tetap terpisah. |
| V1.5 — Modul akademik | **BELUM DIMULAI** | Presensi, semester, mata pelajaran, kurikulum, asesmen, nilai, kalender, portfolio teks, dan insight berkala belum ada untuk JOBEN. |
| V2 — Fitur lanjutan | **BELUM DIMULAI** | AI, analytics lanjutan, foundation/group, dan API ekosistem belum ada; tetap menunggu kebijakan dan evaluasi keselamatan. |
| Baseline MisiPintar | **SUDAH ADA; WAJIB DIREGRESI** | Domain keluarga, anak, misi, saldo/ledger, subscription keluarga, pembayaran, dan histori sudah ada. Perubahan JOBEN harus menjaga data dan perilaku tersebut. |

**Tanda status:** **SELESAI** = bukti implementasi dan tes untuk kriteria itu tersedia; **SEBAGIAN** = ada bagian yang berjalan tetapi kriteria belum terpenuhi seluruhnya; **BELUM DIMULAI** = belum ada alur terintegrasi; **TERBUKA** = memerlukan keputusan produk, hukum, finance, atau operasi.

## Batas produk yang tetap berlaku (PRD §1, §4, §9)

- JOBEN memperluas MisiPintar; tidak menggantikan SIS, akuntansi, payroll, LMS, atau sistem pemerintah sekolah.
- `FamilySpace` tetap merupakan tenant keluarga. School memakai tenant dan membership terpisah. Tidak ada migrasi otomatis atau pencocokan otomatis anak keluarga ke roster sekolah.
- V1 tidak mencakup jejaring sosial/profil publik anak, galeri kelas, leaderboard publik/lintas sekolah, upload foto/video aktivitas sebagai evidence, biometrik/pengenalan wajah/analisis emosi, data medis/diagnosis, atau keputusan berdampak tinggi oleh AI.
- Foto profil anak boleh opsional dan privat untuk identifikasi akun saja; tidak boleh dianalisis atau dipakai sebagai penilaian/evidence.
- Kontak wali, tanggal lahir, gender, dan identitas eksternal hanya dikumpulkan bila perlu dan dasar pemrosesannya terdokumentasi. NIK/NISN, alamat rumah, diagnosis, dan foto bukan field wajib roster.
- Marketplace, semua integrasi kurikulum, WhatsApp/SMS, SSO, dan API pihak ketiga bukan prasyarat V1 sebelum kebutuhan pilot, kontrak, dan batas akses terbukti.
- Metrik penggunaan adalah metrik produk, bukan skor permanen atau ranking kualitas seorang anak.

## Temuan penting sebelum roadmap dijalankan

1. **PRD dan repositori tidak lagi sejalan.** PRD menyatakan belum ada perubahan kode/schema/database serta Tahap 1 dimulai setelah persetujuan PRD. Namun repositori sudah memiliki migration `20261004000000_joben_school_phase1`, model sekolah, dan alur school-admin/invitation. Catat persetujuan dan status PRD yang benar sebelum memperluas scope; roadmap ini tidak menganggap persetujuan itu sudah diberikan.
2. **Development dan production harus dipisahkan.** Pemeriksaan setup terakhir menemukan sembilan migration development berstatus up-to-date, termasuk migration sekolah. Database production belum dimigrasikan atau di-deploy. Jangan menganggap hasil development sebagai bukti aman untuk production.
3. **Upload bukti aktivitas anak masih aktif.** `POST /api/upload/proof` menerima foto dari akun anak, dan `/api/files/[id]` menyajikan file tanpa pemeriksaan sesi/relasi. Ini belum sesuai dengan batas PRD yang melarang upload media aktivitas baru. Hentikan upload baru melalui kontrol client **dan** server sebelum peluncuran JOBEN; jangan menghapus media lama secara massal sebelum kebijakan retensi dan persetujuan ditetapkan.
4. **Tes belum membuktikan integrasi sekolah.** Tes JOBEN yang terlihat mencakup token invitation dan redirect admin. Tes lintas tenant untuk school action/API, alur database invitation, assignment kelas, consent, dan E2E belum tersedia. Tes keluarga dan webhook pembayaran lama bukan pengganti tes tersebut.
5. **Kualitas rilis masih punya gate teknis.** Pemeriksaan terakhir: 54/54 tes lulus, tetapi lint seluruh repositori gagal dengan 129 error dan 65 warning. Lint konfigurasi `next.config.ts` lulus. Proposal perbaikan lint masih menunggu keputusan dan tidak diduplikasi di roadmap ini.
6. Tolok ukur pesaing dan diferensiasi JOBEN pada PRD adalah konteks/hipotesis untuk divalidasi, bukan bukti adopsi atau keberhasilan belajar.

## Roadmap Now / Next / Later

| Horizon | Inisiatif | Hasil yang harus dicapai | Status dan dependensi |
|---|---|---|---|
| **NOW — gate sebelum perluasan/pilot** | Rekonsiliasi PRD dan persetujuan | Tetapkan status PRD, approver, keputusan §15, ruang lingkup pilot, dan urutan migration. Perbarui changelog/status PRD setelah disetujui. | **TERBUKA** — keputusan produk, hukum, finance, dan operasi belum tercatat. |
| **NOW — gate sebelum perluasan/pilot** | Tutup Tahap 1 | Selesaikan provisioning, role/assignment, perubahan kelas/enrollment, dan alur staf; uji setiap server page/action dan percobaan lintas tenant. | **SEBAGIAN** — beberapa alur sudah terhubung; rinciannya pada Tahap 1 di bawah. |
| **NOW — gate privasi** | Lindungi media aktivitas anak | Tolak upload baru di UI dan server, tinjau penyajian file dan daftar media lama, lalu putuskan retensi tanpa penghapusan massal otomatis. | **BELUM SESUAI PRD** — endpoint upload dan file serving saat ini masih ada. |
| **NOW — gate sebelum data anak sekolah digunakan** | Tata kelola data anak dan kesiapan pilot | Selesaikan controller/processor, dasar pemrosesan, consent, umur/fitur, retensi, hak data, incident response, hosting, backup/restore, dan proses permintaan subjek data. | **TERBUKA** — legal review dan verifikasi lingkungan produksi diperlukan sebelum data nyata/live. |
| **NEXT — Tahap 2** | Roster dan assignment staf | Import CSV dengan preview/error per baris/idempotensi; assignment guru ke kelas; pencarian/paginasi tenant-scoped; arsip dan perpindahan enrollment yang menyimpan histori. | Menunggu Tahap 1, dasar pemrosesan roster, dan desain audit. |
| **NEXT — Tahap 2** | Hubungan wali–siswa dan consent | Sekolah memulai undangan terbatas; sekolah memverifikasi wali; wali menerima/menolak, melihat pemberitahuan dan consent; cabut consent memutus akses; tidak ada auto-match ke akun anak lama. | Menunggu keputusan legal, consent, retensi, dan verifikasi pengguna anak. |
| **NEXT — Tahap 2** | Pengalaman guru, keluarga, dan anak | Dashboard sesuai role/tenant/kelas/hubungan; misi JOBEN terhubung tanpa menggandakan saldo; review/reward mengikuti kebijakan keluarga dan sekolah; notifikasi/pengaturan penerima. | Menunggu hubungan dan assignment yang aman; regression MisiPintar wajib. |
| **LATER — Tahap 3** | Evidence dan Development Passport | Kompetensi terkonfigurasi, observasi individual/bulk, evidence teks non-media dengan sumber/penulis/waktu/visibilitas, ringkasan dan laporan, koreksi beralasan dengan riwayat. | Menunggu model role/scope Tahap 2, privacy review, serta uji usability observasi. |
| **LATER — Tahap 4** | Subscription dan billing sekolah | Pricing admin dengan periode efektif; preview dari enrollment aktif; snapshot invoice immutable; hosted checkout DOKU bila disetujui; webhook idempoten; overdue/refund/export/audit/monitoring. | Menunggu persetujuan finance/legal atas harga, pajak, siklus, prorata, grace period, dan refund provider. Jangan memakai model invoice keluarga. |
| **DIRECTIONAL — V1.5** | Modul akademik | Presensi, tahun ajaran/semester, mata pelajaran, kurikulum, learning outcome, asesmen, nilai, kalender, portfolio teks/refleksi, timeline dan insight berkala. | Prioritas dan pilot perlu divalidasi; jangan menanam kurikulum ke kode. |
| **DIRECTIONAL — V2** | AI dan perluasan ekosistem | Copilot/insight hanya berupa draft yang disetujui manusia; rekomendasi, analytics, group multi-sekolah, dan API setelah kebijakan vendor/data/safety siap. | Menunggu persetujuan kebijakan AI, vendor, consent, retensi, dan evaluasi keselamatan. AI bukan dependency operasi inti. |

**Hasil ukur yang berasal dari PRD, belum merupakan baseline produksi:** North Star adalah anak aktif mingguan dengan sedikitnya satu interaksi perkembangan bermakna; median observasi sederhana <20 detik; API p95 <500 ms; query normal <200 ms; dashboard berguna <2 detik; target awal RPO ≤15 menit dan RTO ≤4 jam. Validasi beban, metrik dasar, biaya, dan kemampuan hosting harus dilakukan sebelum menyatakan target layanan.

## Aturan domain rinci yang harus masuk acceptance test

- **Misi/reward (§9.3, §8.6):** pilihan konfigurasi sekolah adalah XP saja, XP + badge, XP + reward, atau XP + uang virtual. Leaderboard sekolah default nonaktif; bila disetujui, hanya internal kelas/sekolah, tidak lintas sekolah, dan identitas anak diminimalkan. Reward sekolah tidak menulis langsung ke saldo keluarga tanpa aturan, transaksi ledger, dan idempotensi yang eksplisit.
- **Development Passport (§9.4):** dimensi awal tetap dapat dikonfigurasi:
  - Karakter: tanggung jawab, disiplin, kejujuran, empati, kepedulian, ketangguhan, kemandirian.
  - Pengetahuan: literasi, numerasi, sains, bahasa, sosial, digital, literasi finansial.
  - Berpikir: berpikir kritis, pemecahan masalah, penalaran, kreativitas, pengambilan keputusan.
  - Keterampilan: komunikasi, kolaborasi, presentasi, keterampilan praktis dan digital.
  - Kebiasaan dan kesejahteraan: rutinitas, aktivitas fisik, regulasi diri yang teramati, interaksi sosial, keterlibatan belajar; bukan diagnosis.
  - Level deskriptif yang diusulkan: **Belum teramati → Mulai tumbuh → Berkembang → Konsisten → Kuat**. Tidak menggabungkan dimensi menjadi satu skor/ranking.
- **Setiap insight/evidence (§9.4):** tampilkan evidence pendukung, sumber (sekolah/rumah/anak), penulis, tanggal, kompetensi, konteks, dan status keterlihatan. Gunakan bahasa deskriptif berbatas waktu. Koreksi memerlukan alasan dan mempertahankan nilai/jejak sebelumnya; data guru tidak otomatis terlihat semua wali/guru.
- **Komunikasi (§9.5):** pengumuman sekolah/kelas, pesan guru-wali, status dibaca, histori, preferensi, jam tenang, mute, deduplikasi pengiriman, dan log. Setiap penerima harus sesuai assignment guru dan relasi wali-siswa; kanal awal in-app/email.
- **Billing (§9.6):** hitung enrollment aktif pada waktu snapshot dalam zona waktu sekolah; satu siswa dihitung satu kali per sekolah. Perubahan sesudah snapshot berlaku pada periode berikutnya jika aturan tanpa prorata disetujui. Simpan snapshot sekolah/periode/count/tarif/diskon/pajak/total/mata uang/tanggal/provider/status; invoice lama tidak berubah. Simpan uang sebagai integer unit terkecil yang berlaku dan tampilkan format IDR lokal. Pajak/diskon/tier tidak boleh memakai angka contoh PRD sebagai harga jual.
- **Privasi (§9.7):** catat consent per tujuan, versi pemberitahuan, pemberi, waktu, bukti, masa berlaku, dan pencabutan. Sediakan akses/koreksi/ekspor/penghapusan sesuai role, kontrak, retensi, dan hukum; ekspor berizin, beralasan, diaudit, memakai tautan sementara yang dilindungi dan kedaluwarsa. Tetapkan peta data, retensi/penghapusan, incident response, backup/restore, dan proses permintaan subjek data.
- **AI (§9.8):** labeli semua output **Draf AI**, wajibkan persetujuan orang yang berwenang sebelum dicatat/dikirim, dan catat tujuan/provider/approval sesuai retensi. Jangan mendiagnosis, membuat profil/label permanen, mengubah reward/hukuman dari inferensi, mengambil keputusan berdampak tinggi, atau memakai data anak untuk melatih provider secara default. Operasi inti harus tetap berjalan saat AI gagal.

## Audit Tahap 0 — Review dan kesiapan

| Butir PRD | Status | Bukti / pekerjaan yang tersisa |
|---|---|---|
| Review PRD dan persetujuan keputusan | **SEBAGIAN / TERBUKA** | PRD 1.0 tersedia; §15 masih meminta persetujuan hukum/bisnis. Belum ada approver atau catatan persetujuan. |
| Inventaris endpoint, form, tabel dan alur lama | **SEBAGIAN** | Audit ini menemukan alur sekolah yang sudah ada dan upload bukti keluarga yang masih aktif. Lengkapi inventaris semua endpoint, data lama, akses file, dan integrasi sebelum perubahan produksi. |
| Database development dan migration history | **SELESAI UNTUK DEVELOPMENT** | Setup terakhir memeriksa sembilan migration berstatus up-to-date. Production tidak diperiksa/dimigrasikan dalam pekerjaan ini. |
| Klasifikasi hukum, consent, controller/processor, pricing, overdue | **TERBUKA** | Belum ada keputusan yang dapat dipakai sebagai dasar pemrosesan data anak atau penagihan live. |
| Ketidakselarasan PRD dengan implementasi | **TERBUKA** | PRD menyebut belum ada implementasi; migration dan kode Tahap 1 sudah ada. Tetapkan status dokumen dan catat penyimpangan historis. |

## Audit Tahap 1 — Fondasi tenant dan akses

**Yang sudah memiliki kode terintegrasi:** schema/migration additive untuk `School`, `SchoolMembership`, `SchoolInvitation`, `SchoolClass`, `SchoolStudent`, `SchoolEnrollment`, dan `SchoolClassTeacher`; kunci/foreign key membatasi relasi enrollment dan assignment dalam tenant. Platform Admin dapat membuat sekolah berstatus menunggu tinjauan, membuat ulang undangan owner, dan mengaktifkan/menangguhkan tenant. Admin sekolah dapat mengubah profil, membuat kelas, menambah/nonaktifkan siswa, mengundang staf yang sudah mempunyai akun keluarga, mencabut undangan, serta menangguhkan/mengaktifkan membership staf non-owner. Perubahan utama menulis `AdminAuditLog`. Token undangan acak disimpan sebagai hash SHA-256 dan memiliki masa berlaku.

| Area | Status | Gap terhadap PRD / langkah penutupan |
|---|---|---|
| `/adm-panel` dan redirect | **SEBAGIAN** | Login menerima Platform Admin dan akun PARENT dengan membership OWNER/ADMIN aktif. Redirect untuk superadmin, satu sekolah, dan pemilih beberapa sekolah sudah ada. Principal/Teacher/Homeroom belum memiliki ruang kerja; mereka tidak boleh diarahkan ke fitur yang belum tersedia. Tes saat ini hanya menguji helper redirect. |
| Otorisasi server | **SEBAGIAN** | Layout superadmin memeriksa `SUPER_ADMIN`; halaman sekolah dan mutation admin sekolah memeriksa membership OWNER/ADMIN aktif, `schoolId`, dan status tenant. Belum ada tes integrasi per role, IDOR, cross-tenant, akses class-scope, akses URL langsung, atau pencabutan akses/session. |
| Pendaftaran/review sekolah | **SEBAGIAN** | Sekolah hanya dibuat Platform Admin untuk email akun PARENT yang sudah ada; status default `PENDING_REVIEW`. Platform Admin dapat aktifkan atau suspend, tetapi tidak ada status ditolak beserta alasan. Owner tidak mendaftar/memverifikasi kontak sendiri; undangan dibuat sebagai tautan manual, bukan email sistem. |
| Pengelolaan staf | **SEBAGIAN** | Owner/Admin mengundang email akun PARENT yang sudah terdaftar, memilih role, mengirim tautan secara manual, mencabut undangan, dan mengganti status membership. Belum ada akun staff baru/verified yang berdiri terpisah dari akun keluarga, perubahan role membership, pengiriman email, atau resend invitation staf. Penerimaan role selain OWNER/ADMIN berhenti di halaman yang menyatakan workspace guru belum tersedia. |
| Kelas dan assignment guru | **SEBAGIAN** | Kelas dapat dibuat dengan grade dan tahun ajaran; model `SchoolClassTeacher` tersedia. Belum ada mutation/UI untuk assign/unassign guru, arsipkan kelas, atau menguji teacher hanya melihat assignment miliknya. |
| Roster dan enrollment | **SEBAGIAN** | Admin membuat siswa secara manual dan menonaktifkan/mengaktifkan kembali; enrollment awal dan akhir saat nonaktif tersimpan. Tidak ada import CSV, preview, error per baris, update/pindah kelas, pencarian atau paginasi. Halaman hanya mengambil hingga 200 siswa. Model membership tidak menyimpan rentang berlaku/pembuat seperti kebutuhan PRD. |
| Kontak/setting sekolah | **SEBAGIAN** | Model memuat nama, slug, email/phone opsional, timezone, dan status; UI hanya mengubah nama/slug/timezone. Negara dan setting tenant belum tersedia. |
| Audit dan invitation | **SEBAGIAN** | Audit mencatat beberapa perubahan tenant, membership, invitation, kelas, siswa, dan penerimaan invitation. Belum ada tes alur database/action; kebijakan redaksi field sensitif, alasan tindakan yang wajib, audit assignment/role, dan retensi log perlu dilengkapi. Token invitation diuji pada unit test helper, bukan seluruh alurnya. |
| Kriteria selesai Tahap 1 | **BELUM TERCAPAI** | Tidak semua role memiliki pengalaman yang dimaksud; teacher workspace/assignment dan tes akses lintas tenant belum ada. Keberadaan migration dan panel admin tidak cukup untuk menutup Tahap 1. |

## Audit Tahap 2–4, V1.5, dan V2

| Tahap / kapabilitas | Status saat ini | Yang harus dibangun secara terintegrasi |
|---|---|---|
| **Tahap 2 — Import roster** | **BELUM DIMULAI** | CSV hanya memuat data minimum; preview valid/duplikat/error per baris; validasi struktur; konfirmasi; audit; re-import idempoten; tidak menerima NIK/NISN/alamat/diagnosis/foto sebagai kolom wajib. |
| **Tahap 2 — Wali dan anak** | **BELUM DIMULAI** | Undangan wali diprakarsai sekolah, hubungan diverifikasi, pemberitahuan/consent versi tercatat, wali dapat menerima/menolak/mencabut, akses langsung dicabut; tidak ada pencarian bebas atau auto-link berbasis PII. |
| **Tahap 2 — Dashboard dan misi** | **BELUM DIMULAI untuk JOBEN** | Dashboard Teacher/Homeroom/Principal/Parent/Child dengan query sesuai tenant, assignment, dan relasi. Misi sekolah dan review harus memakai aturan reward yang jelas dan tidak menulis ke saldo keluarga tanpa ledger/idempotensi yang benar. |
| **Tahap 2 — Komunikasi** | **BELUM DIMULAI untuk JOBEN** | Pengumuman sekolah/kelas, pesan guru-wali, status dibaca, histori, preferensi, jam tenang, mute, kanal in-app/email, serta scope penerima. Tidak ada feed publik; WhatsApp/SMS bukan dependency awal. |
| **Tahap 3 — Evidence/Passport** | **BELUM DIMULAI** | Dimensi dan level terkonfigurasi, observasi cepat individual/bulk, evidence tanpa media aktivitas, sumber/author/waktu/kompetensi/konteks/visibilitas, ringkasan tanpa satu skor/ranking, koreksi beralasan dengan versi sebelumnya, laporan anak-keluarga. |
| **Tahap 4 — Billing sekolah** | **BELUM DIMULAI** | Pricing khusus Platform Admin; hitung enrollment aktif pada snapshot dan timezone sekolah; preview rekonsiliabel; invoice/item immutable; DOKU hosted checkout untuk invoice baru sesuai konfigurasi; webhook terverifikasi/idempoten; histori pembayaran, refund/adjustment yang diaudit, overdue/grace period, export, monitoring, backup/restore, dan uji keamanan. |
| **V1.5 — Akademik** | **BELUM DIMULAI** | Presensi, semester, mata pelajaran, kurikulum/learning outcome, asesmen/nilai, kalender, portfolio teks/refleksi, timeline perkembangan, dan insight berkala orang tua. |
| **V2 — AI dan ekosistem** | **BELUM DIMULAI** | AI hanya membuat draft/saran yang disetujui manusia; tidak mendiagnosis, memprofilkan, memberi reward/hukuman otomatis, atau mengambil keputusan berdampak tinggi. Default data anak tidak dipakai melatih model provider. Gangguan AI tidak boleh menghentikan operasi inti. Group multi-sekolah/API hanya setelah kebutuhan pilot dan kontrol data terbukti. |

## Baseline MisiPintar yang wajib dipertahankan

| Area | Kondisi dan batas integrasi |
|---|---|
| Akun dan ruang keluarga | `FamilySpace`, `User`, dan `Child` tetap menjadi domain keluarga. Akun Parent/Child dan riwayat yang sudah ada tidak dipindahkan atau dicocokkan otomatis dengan roster JOBEN. |
| Misi, approval, XP/reward, saldo dan ledger | Mekanisme keluarga yang sudah ada tetap berjalan dan diuji regresi. Misi sekolah tidak boleh menggandakan saldo/histori atau memberi reward dua kali. |
| Subscription dan pembayaran keluarga | Subscription/invoice keluarga serta checkout invoice baru via DOKU tetap terpisah dari histori Midtrans dan QRIS manual. Ini bukan billing sekolah dan tidak dapat dipakai untuk menandai invoice sekolah lunas. |
| Upload aktivitas | Endpoint upload bukti anak dan penyajian file masih ditemukan. PRD meminta upload aktivitas baru dinonaktifkan; selesaikan gate privasi dan tinjau file historis tanpa penghapusan massal sebelum JOBEN digunakan dengan anak. |
| Migration dan regression | Migration sekolah yang ada bersifat additive terhadap domain keluarga. Uji selanjutnya tetap perlu memakai fixture/cadangan yang mewakili data lama dan membandingkan hitungan sebelum/sesudah; development yang kosong tidak membuktikan preservasi data production. |

## Kontrak integrasi dan gate lintas fitur (§10–12 PRD)

Kontrak ini berlaku untuk setiap halaman, form, Server Action, Route Handler, job, webhook, pencarian, dan export—bukan hanya halaman admin.

| Area | Syarat implementasi dan verifikasi |
|---|---|
| Batas domain | FamilySpace/akun keluarga; School/setting/membership/invitation/audit; roster/enrollment/assignment; pengaitan wali-anak/consent; belajar/evidence; billing sekolah; privacy request/notifikasi/export adalah domain berbeda. Setiap record sekolah dibatasi tenant di server. Foreign key/unique constraint dan transaksi mencegah enrollment/relasi silang. |
| Baca dan tulis | Server membangun akses dari session tervalidasi + role + tenant + resource + assignment/relasi + tujuan. Nilai `schoolId`, role, atau pemilik yang dikirim browser tidak membuktikan akses. Validasi client hanya membantu UX; server tetap menjadi validasi authoritative. |
| Hasil dan state UI | Hasil mutation bertipe sukses/error; pesan aman dalam Bahasa Indonesia tanpa stack trace/PII berlebih. Setiap form punya pending/loading, success, validation, network/permission error, empty, dan retry aman. |
| Idempotensi dan transaksi | Invitation, import, payment, approval/reward, dan mutation yang dapat diulang tidak menggandakan efek; operasi multi-record berjalan atomik. |
| Audit | Perubahan sensitif menyimpan actor, tenant, resource, waktu, alasan bila diperlukan, dan nilai sebelum/sesudah; samarkan field sensitif. Berlaku untuk role, assignment, wali, consent, export, pricing, payment, dan koreksi evidence. |
| Cache dan bahasa | Data anak dicache hanya dengan scope user/tenant yang benar dan diinvalidasi saat role, membership, consent, atau data berubah; jangan gunakan cache global untuk data sensitif. Semua teks pengguna memakai Bahasa Indonesia mudah dipahami; siapkan localization keys dengan `id-ID` default dan `en-US`. |
| Keamanan | Verifikasi TLS, password hashing, cookie/session, rate limit/brute force, validasi input, output encoding, strategi CSRF, dan dependency/security scan. Log tidak menyimpan password/token/secret, isi data anak yang tidak perlu, atau payload pembayaran utuh tanpa redaksi. Uji IDOR, privilege escalation, cross-tenant, class-scope, webhook replay, dan file path traversal. |
| Performa/reliabilitas | Ukur p95 API <500 ms untuk CRUD normal pilot, query normal <200 ms, dashboard berguna <2 detik; laporan/export berat asynchronous dengan status/retry/expiry. Gangguan AI, email, notifikasi, atau provider pembayaran tidak boleh menjatuhkan operasi inti. |
| UX/aksesibilitas | Parent/Child mobile-first; staf tetap berfungsi di ponsel/tablet. Label, keyboard, fokus, error yang terhubung ke input, kontras, dan screen reader diperiksa; target WCAG 2.2 AA untuk alur inti. |
| Operasi | Uji backup terenkripsi dan restore; validasi target RPO/RTO terhadap hosting; dokumentasikan deployment/recovery, incident, privasi, dan dukungan sebelum pilot. |

## Matriks seluruh kriteria penerimaan V1 (§13 PRD)

| ID | Kriteria PRD | Status audit | Bukti / yang masih dibutuhkan |
|---|---|---|---|
| A1 | `/adm-panel` menerima Platform Admin dan School Owner/Admin yang valid | **SEBAGIAN** | Provider admin menerima SUPER_ADMIN dan PARENT dengan membership OWNER/ADMIN aktif. Tes alur login terhadap database dan role belum ada. |
| A2 | Redirect role-aware dan pemilih tenant multi-membership | **SEBAGIAN** | Redirect helper dan halaman pemilih ada; hanya owner/admin yang tercakup, tes helper ada tetapi alur penuh belum diuji. |
| A3 | Parent/Child tidak memperoleh akses admin lewat login atau URL | **SEBAGIAN** | Login admin membatasi role; halaman sekolah dan mutation memeriksa sesi/membership. Tes negatif URL/action per role belum ada. |
| A4 | Platform Admin membuat, mengaktifkan, menangguhkan, dan melihat subscription tenant | **SEBAGIAN** | Buat/aktifkan/tangguhkan ada; status subscription tenant belum ada karena billing sekolah belum dibangun. |
| A5 | School Admin mengubah setting, kelas, anggota, enrollment; tidak mengubah harga global | **SEBAGIAN** | Profil/kelas/anggota dan enrollment awal tersedia. Pengelolaan enrollment/assignment dan pricing/billing sekolah belum ada. |
| A6 | Request lintas tenant ditolak termasuk ID URL/request yang diganti | **SEBAGIAN** | Manager action mengambil membership berdasarkan sesi dan tenant. Belum ada test eksplisit school A → school B untuk baca maupun tulis. |
| A7 | Teacher/Homeroom hanya membaca siswa di assignment aktif | **BELUM DIMULAI** | Assignment belum dapat dikelola; teacher workspace/query dan tes class-scope belum ada. |
| A8 | Suspensi membership segera mencabut akses sekolah tanpa menghapus akun/histori keluarga | **SEBAGIAN** | Status membership dicek pada akses manager dan dapat diubah. Belum ada tes pencabutan pada semua request, cache, sesi, dan role non-manager. |
| F1 | Import roster menampilkan preview/error per baris dan mencegah duplikat | **BELUM DIMULAI** | Hanya tambah siswa satu per satu; tidak ada parser/import UI atau tes import. |
| F2 | Parent melihat siswa hanya setelah relasi wali diverifikasi dan consent tersimpan | **BELUM DIMULAI** | Belum ada model relasi wali-siswa, verifikasi, atau consent. |
| F3 | Parent A tidak dapat membaca siswa B melalui UI/action/API/export/search | **BELUM DIMULAI** | Portal wali, pencarian, export, serta security test relasi belum ada. |
| F4 | Link ke akun Child lama dilakukan wali berwenang; tidak ada auto-match | **BELUM DIMULAI** | Tidak ada alur link akun anak; jangan menambahkan auto-match berdasarkan nama/PII. |
| D1 | Migration mempertahankan akun, misi, XP, level, streak, saldo, reward, ledger, histori | **SEBAGIAN** | Migration sekolah menambah tabel dan menyatakan tidak mengubah tabel keluarga; perlu tes upgrade pada data representatif dan perbandingan before/after. |
| D2 | Approval berulang/serentak tidak memberi reward ganda | **SEBAGIAN** | Tes aksi tugas dan ledger keluarga tersedia; idempotensi sekolah/reward terintegrasi dan pengujian serentak harus dipastikan sebelum menghubungkan misi sekolah. |
| D3 | Observasi individual/bulk menghasilkan evidence yang terlacak | **BELUM DIMULAI** | Model dan alur observasi/evidence belum ada. |
| D4 | Koreksi evidence diaudit dan mempertahankan versi lama | **BELUM DIMULAI** | Versioning dan alur correction belum ada. |
| D5 | Insight berbasis evidence; tanpa satu skor atau ranking publik bawaan | **BELUM DIMULAI** | Insight JOBEN belum ada; desain Tahap 3 harus mengikuti larangan skor tunggal/ranking publik. |
| D6 | Upload media aktivitas ditolak di client dan server; foto profil bukan evidence | **BELUM SESUAI PRD** | `POST /api/upload/proof` masih menerima foto aktivitas anak. File serve route juga ditemukan tanpa auth. Blokir upload baru dan audit akses/retensi file historis. |
| P1 | Jumlah siswa tertagih dihitung dari enrollment aktif | **BELUM DIMULAI** | Enrollment ada, tetapi tidak ada billing school/count snapshot. |
| P2 | Preview/invoice/diskon/pajak/total direkonsiliasi dari snapshot | **BELUM DIMULAI** | Tidak ada school invoice, pricing snapshot, atau preview. |
| P3 | Perubahan harga/roster tidak mengubah invoice lama | **BELUM DIMULAI** | Invoice sekolah immutable belum ada. |
| P4 | Webhook payment terverifikasi/idempoten; gangguan tidak menandai PAID | **SEBAGIAN untuk keluarga; BELUM DIMULAI untuk sekolah** | Webhook DOKU dan Midtrans keluarga memiliki implementasi/tes. Belum ada invoice atau webhook subscription sekolah. |
| P5 | Halaman/form utama menyediakan loading, empty, validation, success, error, permission states | **SEBAGIAN** | Workspace sekolah yang sudah ada memakai pending/feedback/empty states; cakupan ini belum mencakup alur yang belum dibangun dan belum diverifikasi E2E/accessibility. |
| P6 | Semua mutation memvalidasi role/tenant/resource di server | **SEBAGIAN** | School Admin dan Platform Admin actions yang ada melakukan pemeriksaan server-side. Belum ada audit/test menyeluruh untuk seluruh route/job/export/webhook yang kelak ditambahkan. |
| P7 | Consent/revocation/export/privacy request tercatat tanpa PII/secret berlebih | **BELUM DIMULAI** | Model, workflow, audit, expiry, serta tes hak data belum ada. |
| T1 | Unit test billing, status enrollment, permission, reward, versi evidence | **SEBAGIAN** | Ada tes keluarga untuk task/reward, redirect admin, dan helper invitation; belum ada billing sekolah, permission tenant/class, status enrollment lengkap, atau evidence version test. |
| T2 | Integration test database, transaksi atomik, migration, webhook | **SEBAGIAN** | Tes transaksi/webhook keluarga tersedia dan migration diterapkan di development; integration test alur sekolah dan migration pada data representatif belum tersedia. |
| T3 | Server-action/API test per role termasuk akses tanpa izin | **BELUM TERPENUHI** | Tes sekolah terbatas pada token helper dan redirect; perlu tes action/page per role, tenant, status, dan resource. |
| T4 | E2E end-to-end: sekolah → roster → observasi → wali → billing | **BELUM DIMULAI** | Belum ada dashboard/observasi/wali/billing sekolah untuk menjalankan skenario tersebut. |
| T5 | Security E2E parent asing, guru kelas lain, tenant lain semuanya ditolak | **BELUM DIMULAI** | Belum ada test E2E privilege/IDOR/class-scope/cross-tenant. |
| T6 | Regression E2E akun Parent/Child, misi, approval, ledger, checkout DOKU, invoice lama | **SEBAGIAN** | Unit/integration test pilihan untuk aksi keluarga dan provider ada; rangkaian regression E2E lengkap yang disyaratkan belum ada. |
| T7 | Migration diuji pada salinan development/staging dengan hitungan sebelum/sesudah; bukan pertama kali di production | **SEBAGIAN** | Migration development telah diterapkan. Belum ada bukti uji pada salinan berisi data representatif/staging serta laporan hitung before/after. Production tidak dimigrasikan dalam pekerjaan ini. |

## Gate Definition of Done (§14 PRD)

| Gate | Status | Penutupan yang dibutuhkan |
|---|---|---|
| Schema/migration dan validasi | **SEBAGIAN** | Fondasi tenant/roster ada; tambahkan model dan constraints hanya sesudah keputusan domain/privasi disetujui. |
| Backend dan otorisasi tenant/role | **SEBAGIAN** | Alur manager dasar ada; lengkapi principal/teacher/guardian/class-scope serta tes negatif. |
| Frontend terhubung ke backend | **SEBAGIAN** | Provisioning dan workspace admin terhubung; fitur yang masih berupa rencana belum boleh dihitung selesai karena tabel/UI placeholder. |
| Loading, empty, success, error, permission | **SEBAGIAN** | Ada untuk beberapa form sekolah; wajib diuji untuk tiap alur baru, termasuk gagal jaringan dan retry aman. |
| Audit, privasi, localization | **SEBAGIAN** | Audit beberapa mutation dan UI Bahasa Indonesia ada; consent, hak data, redaksi, email/notifikasi, serta audit alasan belum tuntas. |
| Migration/regression/security test | **SEBAGIAN** | 54 tes terakhir lulus; cakupan school security/E2E dan migration data representatif belum ada. |
| Mobile dan aksesibilitas | **BELUM DIVERIFIKASI** | Tinjau alur inti pada ponsel/tablet dan validasi WCAG 2.2 AA; tampilan responsif saja belum menjadi audit aksesibilitas. |
| Operasi dan recovery | **BELUM DIVERIFIKASI** | Perbarui runbook, uji backup/restore, incident/data request, monitoring dan kesiapan runtime cPanel; target RPO/RTO belum dikonfirmasi. |
| Log/metric tidak membocorkan data anak | **BELUM DIVERIFIKASI** | Audit application/provider logs, upload/file serving, analytics dan redaksi sebelum data pilot. |
| Tidak ada regresi MisiPintar | **SEBAGIAN** | Migration additive dan sejumlah tes keluarga tersedia; jalankan regression E2E penuh dengan data dan alur pembayaran lama/baru. |

## Keputusan terbuka yang menjadi dependency (§15 PRD)

Semua keputusan berikut tetap **TERBUKA** sampai ada persetujuan eksplisit. Default PRD bukan keputusan bisnis/hukum final. Karena migration dan kode Tahap 1 sudah ada sebelum status persetujuan terdokumentasi, tinjau apakah perlu penyesuaian sebelum penambahan schema atau penggunaan data nyata.

| Keputusan | Default PRD | Gate sebelum |
|---|---|---|
| Pendaftaran dan review sekolah | Owner mendaftar; Platform Admin menyetujui sebelum aktivasi siswa | Perluasan provisioning dan penggunaan roster nyata |
| Harga dan siklus | Snapshot bulanan enrollment aktif; perubahan untuk periode berikut; tanpa prorata V1 | Pricing dan billing sekolah live |
| Tunggakan | Grace period default 7 hari; setelah itu read-only terbatas, data tidak dihapus | Otomasi suspensi/akses billing |
| Pajak, diskon, minimum/tier | Diatur Platform Admin setelah finance/legal menyetujui | Kalkulasi preview/invoice |
| Hubungan hukum sekolah/JOBEN | Controller/processor, kontrak, instruksi pemrosesan dipetakan | Pengumpulan/pemrosesan data siswa |
| Umur dan consent anak | Tinjauan hukum atas regulasi terbaru; ambang fitur tidak ditebak | Akun anak, undangan wali, consent |
| Refund sekolah | Ikuti proses provider terverifikasi; bukan sekadar ubah status DB | Refund/adjustment |
| Kontak undangan wali | Hanya saat dibutuhkan, tujuan dan akses terbatas | Impor kontak atau undangan wali |
| Integrasi roster/kurikulum | CSV dulu; integrasi eksternal setelah pilot/kontrak teknis | Konektor/SIS eksternal |
| Hosting Node dan recovery | Pipeline saat ini dipertahankan sampai runtime, budget build, backup, RPO/RTO diverifikasi | Pilot produksi dan komitmen layanan |

Tinjauan hukum sebelum peluncuran harus memeriksa kembali sumber yang dirujuk PRD: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, PP No. 17 Tahun 2025 tentang Tata Kelola Penyelenggaraan Sistem Elektronik dalam Pelindungan Anak, dan Permenkomdigi No. 9 Tahun 2026. Daftar ini bukan nasihat hukum atau bukti kepatuhan.

## Risiko yang harus dipantau (§16 PRD)

| Risiko | Kontrol dan bukti penutupan |
|---|---|
| Data keluarga dan sekolah tercampur | Tenant terpisah dan link eksplisit; tes IDOR/cross-tenant semua endpoint; tanpa auto-match. |
| Perubahan login memutus akun lama | Pertahankan provider Parent/Child; regression login dan role lama sebelum release. |
| Roster tanpa dasar pemrosesan | Legal gate, minimisasi, consent/pemberitahuan, dan jangan membuka akun anak sebelum policy gate. |
| Jumlah siswa berbeda dari invoice | Hitung dari enrollment aktif, satu siswa sekali, simpan timestamp snapshot, rekonsiliasi yang diaudit. |
| Guru tidak memakai fitur karena lambat | Observasi cepat/bulk, pilot usability, ukur median <20 detik dan error rate. |
| AI merugikan anak | V2 saja; draft dengan approval manusia; tidak ada diagnosis atau keputusan otomatis. |
| cPanel tidak cocok dengan asumsi runtime | Verifikasi Node, memori/build budget, backup/restore, dan pipeline sebelum perubahan deployment. |
| Fitur lama mengunggah foto/video aktivitas | Blokir upload baru di client/server; tinjau file lama dan tetapkan retensi sebelum tindakan historis. |
| Provider pembayaran gagal | Status server-authoritative, retry webhook aman, operasi kelas tetap berjalan, kegagalan bukan status PAID. |

## Kepemilikan, estimasi, dan validasi lanjutan

- **Driver, approver tunggal, kontributor, dan pemilik tiap tahap:** belum ditentukan. Tentukan sebelum komitmen roadmap lintas fungsi.
- **Tanggal dan estimasi:** tidak dicantumkan karena ukuran tim, kapasitas, dan acuan pekerjaan sejenis belum tersedia. Tahap menggambarkan urutan/dependency, bukan janji tanggal.
- **Metrik bisnis:** tidak ada baseline analytics/retensi/harga sekolah di audit ini. Jangan memberi skor RICE tanpa data reach dan effort.
- **Review roadmap:** perbarui status tiap milestone; tinjau PRD setelah review desain, scoping engineering, dan sebelum pilot/peluncuran.

## Indeks bukti implementasi yang diperiksa

- Tenant dan relasi data: `prisma/schema.prisma`, `prisma/migrations/20261004000000_joben_school_phase1/migration.sql`.
- Provisioning Platform Admin: `src/actions/school-platform.ts`, `src/app/(superadmin)/superadmin/schools/page.tsx`, `src/components/school-admin/platform-school-workspace.tsx`.
- Akses/admin sekolah: `src/lib/school-access.ts`, `src/lib/auth/admin-redirect.ts`, `src/lib/auth/config.ts`, `src/app/adm-panel/layout.tsx`, `src/app/school-admin/[schoolSlug]/page.tsx`.
- Undangan, membership, kelas, roster: `src/actions/school-admin.ts`, `src/lib/school-invitations.ts`, `src/app/school-invite/[token]/page.tsx`, `src/app/school-invite/accepted/page.tsx`, `src/components/school-admin/school-admin-workspace.tsx`.
- Tes sekolah yang ditemukan: `src/__tests__/lib/school-invitations.test.ts`, `src/__tests__/auth/admin-redirect.test.ts`.
- Upload bukti keluarga: `src/app/api/upload/proof/route.ts`, `src/app/api/files/[id]/route.ts`, `src/actions/tasks.ts`.
- Domain keluarga dan pembayaran: `prisma/schema.prisma`, tes action keluarga, serta tes webhook DOKU/Midtrans yang ada di `src/__tests__/`.