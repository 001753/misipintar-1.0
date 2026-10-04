# JOBEN — PRD Produk dan Rekayasa

**Versi:** 1.0 — spesifikasi untuk review bersama  
**Tanggal:** 4 Oktober 2026  
**Status:** Spesifikasi disusun sebelum implementasi fondasi  
**Produk dasar:** MisiPintar  
**Nama ekosistem:** JOBEN — School, Family & Child  
**Pasar awal:** Sekolah TK dan SD di Indonesia  
**Bahasa produk:** Bahasa Indonesia yang mudah dipahami; istilah Inggris yang sudah umum boleh digunakan dengan konsisten  
**Pembaca:** Pemangku kepentingan dan tim lintas fungsi (produk, engineering, sekolah, keamanan, operasi)

> Dokumen ini memperjelas PRD JOBEN yang diberikan dan mencocokkannya dengan MisiPintar yang ada. Belum ada perubahan kode, schema, atau database untuk pekerjaan ini. Urutan yang disepakati: selesaikan dan review PRD terlebih dahulu, lalu mulai dari fondasi tenant dan akses.

---

## 1. Ringkasan

JOBEN menghubungkan sekolah, guru, anak, dan orang tua untuk membantu perkembangan anak secara berkelanjutan. JOBEN bukan pengganti MisiPintar: MisiPintar tetap menjadi fitur keluarga, misi, kebiasaan, reward, dan literasi finansial di dalam ekosistem baru.

Sistem harus menghubungkan pengalaman pengguna dan administrasi sekolah dengan backend yang sama. Hak akses ditentukan di server berdasarkan akun, role, sekolah, kelas, hubungan wali-anak, dan status data—bukan berdasarkan menu atau filter di browser.

### Keputusan produk yang sudah dikunci

1. Fitur dan riwayat MisiPintar dipertahankan. Perluasan bersifat aditif, kecuali kontrol berisiko tinggi harus dinonaktifkan.
2. Sekolah adalah tenant baru. `FamilySpace` tetap menjadi ruang keluarga dan tidak diubah menjadi tenant sekolah.
3. `/adm-panel` menjadi satu pintu masuk admin untuk Platform Admin dan admin tenant. Setelah autentikasi, pengguna diarahkan ke panel sesuai role dan sekolah yang dipilih.
4. Rute Platform Admin yang ada (`/superadmin`) dipertahankan. Panel sekolah baru menggunakan `/school-admin`.
5. Tahap kerja sekarang hanya PRD. Implementasi fondasi dimulai setelah PRD direview.
6. Produk ditulis dalam Bahasa Indonesia sederhana; istilah teknis Inggris dapat digunakan bila lebih umum dan jelas.
7. Tolok ukur pasar mencakup produk yang memiliki jejak penggunaan internasional. Angka adopsi pada situs vendor dicatat sebagai klaim vendor, bukan verifikasi independen atau bukti hasil belajar.

### Hasil yang diharapkan

- Sekolah mengelola akun, kelas, siswa, dan akses staf tanpa dapat melihat tenant lain.
- Guru mencatat aktivitas dan evidence siswa dengan cepat, dalam ruang kelas yang menjadi tanggung jawabnya.
- Orang tua melihat hanya anak yang hubungan walinya sudah diverifikasi.
- Anak memakai misi dan progres yang sesuai usianya tanpa profil publik atau peringkat publik.
- MisiPintar tetap berfungsi, termasuk misi keluarga, XP, reward, saldo, histori, dan pembayaran lama.
- Informasi perkembangan dapat ditelusuri kembali ke evidence yang mendasarinya.
- Tagihan sekolah dihitung sistem dari jumlah enrollment aktif, memakai snapshot invoice yang tidak berubah.

---

## 2. Dasar produk dan kondisi sistem saat ini

### 2.1 Sistem yang sudah ada

Kode saat ini adalah aplikasi Next.js App Router dan TypeScript, menggunakan PostgreSQL/Prisma serta NextAuth v5 dengan credentials. Deployment produksi berjalan melalui pipeline GitHub ke cPanel/Passenger; arsitektur tersebut tidak diganti oleh PRD ini.

Model/domain yang sudah ada meliputi:

- `FamilySpace`, `User`, dan `Child`
- `Task` dan `TransactionLedger` untuk misi/tugas keluarga serta saldo anak
- `Plan`, `Subscription`, `Invoice`, `PaymentLog`, dan pembayaran QRIS
- notifikasi, audit admin, konfigurasi aplikasi, OTP, dan login attempts

Role saat ini: `PARENT`, `CHILD`, dan `SUPER_ADMIN`. Orang tua masuk dengan nomor telepon dan kata sandi; akun anak dengan kode keluarga, username, dan kata sandi. Admin saat ini masuk melalui `/adm-panel`, sedangkan halaman operasionalnya berada di `/superadmin`.

### 2.2 Batasan database dan deployment

- Database PostgreSQL adalah system of record. Semua perubahan schema harus memakai migration baru dan mempertahankan migration lama.
- Saat perancangan ini dibuat, database pengembangan yang dipakai preview belum memiliki tabel `Plan` dan `AppConfig` meskipun keduanya tercantum pada Prisma schema dan migration. Sebelum implementasi, status database dan migration history harus diperiksa dan dipulihkan dengan aman; jangan menutupinya dengan `db push` atau migration produksi yang belum diuji.
- Jangan menetapkan Node.js 24 sebagai target hanya berdasarkan PRD lama. Versi runtime produksi cPanel dan kompatibilitas dependency harus diverifikasi sebelum perubahan runtime.
- Jangan mengubah jalur deploy, startup Passenger, atau format output standalone sebagai bagian dari pekerjaan fitur.

### 2.3 Prinsip migrasi MisiPintar

- Tidak ada penghapusan tabel, akun, histori, atau endpoint MisiPintar tanpa rencana migrasi dan persetujuan eksplisit.
- `FamilySpace`, akun, anak, tugas, saldo, ledger, plan keluarga, invoice, serta provider pembayaran lama tetap berada pada domain keluarga.
- Sekolah tidak dibuat dengan mengubah `FamilySpace`; sekolah memakai entitas dan membership tersendiri.
- Data anak MisiPintar tidak dipindahkan otomatis ke sekolah dan tidak dicocokkan berdasarkan nama, tanggal lahir, nomor telepon, atau kemiripan lainnya.
- Pengaitan akun anak MisiPintar dengan catatan siswa sekolah memerlukan undangan yang diverifikasi dan persetujuan yang sesuai. Data historis tetap utuh jika keluarga tidak menghubungkan akunnya.
- Upload bukti foto/video aktivitas anak yang sudah ada harus ditinjau. Upload baru dinonaktifkan untuk fitur aktivitas; penghapusan media historis hanya dilakukan melalui kebijakan retensi dan proses yang disetujui, bukan penghapusan massal saat migration.
- DOKU digunakan untuk checkout invoice baru yang memang dikonfigurasi memakai provider tersebut. Invoice Midtrans lama dan alur QRIS manual tetap terpisah; histori pembayaran tidak digabung atau ditulis ulang.

---

## 3. Riset tolok ukur produk

Riset ini mengamati pola produk dan adopsi yang diterbitkan secara terbuka oleh penyedia. Angka penggunaan bersumber dari situs vendor dan dapat berubah. Riset ini tidak mengukur efektivitas pendidikan, pangsa pasar independen, kepuasan pelanggan, atau harga kontrak sekolah.

| Produk | Bukti jangkauan yang dipublikasikan | Pola produk yang relevan | Penerapan untuk JOBEN |
|---|---|---|---|
| **ClassDojo** | Situs resmi menyebut lebih dari 45 juta murid dan orang tua serta terjemahan pesan dalam 190+ bahasa. | Komunikasi guru-keluarga, alat guru, misi/portfolio, keterlihatan aktivitas, kontrol komunikasi dan audit. | Buat komunikasi dua arah yang ringan, notifikasi yang bisa diatur, dan pengalaman mudah untuk keluarga. Jangan menyalin feed foto/video anak: kebijakan JOBEN melarang media aktivitas anak. |
| **Seesaw** | Situs resmi menyebut lebih dari 150.000 sekolah; halaman global menyebut 25 juta pendidik, murid, dan keluarga di 150+ negara. | Portfolio pembelajaran, suara murid, keterlibatan keluarga, dukungan banyak kurikulum, sinkronisasi roster dan permission. | Jadikan bukti perkembangan mudah dilihat keluarga, tetapi gunakan catatan teks/refleksi/aktivitas, bukan upload media aktivitas. |
| **PowerSchool SIS** | Halaman resmi SIS menyebut 5.300+ distrik dan 17 juta+ siswa dilayani. | Data siswa, kehadiran, jadwal, pelaporan, portal orang tua/siswa, integrasi sistem sekolah. | Bangun data roster dan dashboard sekolah yang konsisten; sediakan jalur integrasi setelah model tenant stabil. |
| **ManageBac+** | Halaman resmi menyebut 800.000+ siswa, 3.000 sekolah, dan 130 negara. | Perencanaan kurikulum, asesmen, laporan, komunikasi sekolah, dukungan kurikulum majemuk. | Kurikulum harus berupa data terkonfigurasi, bukan aturan yang ditanam langsung ke kode. |
| **Toddle** | Materi resmi menyebut 2.500+ sekolah dan menampilkan modul kurikulum, asesmen, laporan, portfolio, komunikasi keluarga, serta kehadiran. | Satu alur kerja untuk perencanaan guru, asesmen, pelaporan, portfolio, dan keluarga. | Kurangi kerja ganda guru; integrasikan catatan perkembangan ke alur yang sudah mereka gunakan. |
| **Pijar Sekolah (Indonesia)** | Situs resmi menunjukkan tugas online, presensi, dan pengelolaan data institusi. Tidak ditemukan angka adopsi skala yang sebanding di sumber resmi yang ditinjau. | Kesesuaian istilah, alur sekolah Indonesia, tugas, presensi, dan administrasi. | Validasi istilah, onboarding, impor roster, dan kebutuhan sekolah lokal sebelum menetapkan integrasi atau klaim posisi pasar. |

### Kesimpulan tolok ukur

1. Komunikasi sekolah-keluarga, akses portal wali, roster yang benar, dan alur guru yang hemat waktu adalah kebutuhan dasar—bukan diferensiasi yang boleh diasumsikan.
2. Portfolio dan evidence lebih berguna bila terhubung ke tujuan belajar dan dapat dilihat pihak yang berwenang.
3. Integrasi roster/permission mengurangi data ganda, tetapi JOBEN tidak boleh membuka akses lintas tenant sebagai efek samping sinkronisasi.
4. JOBEN berpotensi berbeda pada riwayat perkembangan anak lintas rumah dan sekolah yang berbasis evidence serta tetap menjaga batas akses. Keunggulan tersebut adalah hipotesis produk yang harus divalidasi dengan sekolah dan keluarga, bukan klaim pasar yang sudah terbukti.
5. Produk internasional yang ditemukan banyak memakai foto/video. JOBEN sengaja berbeda karena membatasi bukti aktivitas anak pada data non-media.
6. Harga pesaing tidak dibandingkan: halaman publik tidak memberikan dasar yang konsisten untuk harga sekolah, negara, jumlah siswa, dan modul yang sama. Harga JOBEN harus diuji melalui wawancara dan proposal sekolah.

---

## 4. Tujuan, bukan tujuan, dan prinsip keberhasilan

### 4.1 Tujuan

- Menyediakan satu hubungan data yang jelas antara sekolah, guru, siswa, wali, misi, dan evidence perkembangan.
- Memberi sekolah kontrol tenant dan role yang dapat diuji.
- Mengurangi waktu administrasi guru untuk mencatat evidence.
- Membuat informasi perkembangan dapat dipahami orang tua dan anak.
- Menghitung tagihan sekolah dengan cara yang dapat dijelaskan dan diaudit.
- Menyediakan fondasi aman untuk TK/SD di Indonesia, termasuk perlindungan data anak.

### 4.2 Bukan tujuan V1

- Mengganti seluruh SIS, akuntansi, payroll, LMS, atau sistem pemerintah sekolah.
- Membuat jejaring sosial anak, profil anak publik, galeri kelas, atau leaderboard publik.
- Menggunakan foto/video anak untuk bukti, pengenalan wajah, biometric, atau analisis emosi.
- Membuat diagnosis kesehatan, psikologi, disabilitas, atau keputusan berdampak tinggi dari AI.
- Mengintegrasikan semua kurikulum, marketplace, WhatsApp/SMS, SSO, atau API pihak ketiga sebelum kebutuhan pilot terbukti.
- Menggabungkan riwayat akun keluarga dan sekolah tanpa persetujuan serta aturan akses yang jelas.

### 4.3 North Star dan metrik

**North Star:** jumlah anak aktif per minggu yang memiliki sedikitnya satu interaksi perkembangan bermakna pada minggu itu.

Interaksi bermakna: misi selesai, refleksi, aktivitas belajar, observasi guru, kegiatan/observasi orang tua, pencapaian, atau kegiatan akademik yang sudah disetujui.

Metrik pendamping:

- **Sekolah:** tenant aktif, retensi sekolah, siswa aktif, guru aktif, kelas yang terisi.
- **Guru:** median waktu mencatat satu observasi; target awal kurang dari 20 detik untuk alur observasi cepat.
- **Keluarga:** orang tua aktif mingguan, undangan wali yang berhasil, keterlibatan pada misi/insight.
- **Anak:** partisipasi misi, aktivitas refleksi, evidence perkembangan per dimensi; tidak digunakan untuk ranking publik.
- **Bisnis:** jumlah siswa tertagih, invoice dibayar tepat waktu, payment success, churn/retensi sekolah, pendapatan berulang.
- **Keamanan dan privasi:** insiden akses lintas tenant, akses tanpa izin, consent yang kedaluwarsa, permintaan hak data yang belum ditangani, ekspor gagal.

Metrik penggunaan tidak boleh menjadi skor kualitas atau nilai permanen seorang anak.

---

## 5. Tahapan rilis dan ruang lingkup

### Tahap 0 — Review dan kesiapan (pekerjaan saat ini)

- Review PRD dan keputusan yang ditandai “perlu persetujuan”.
- Inventaris endpoint, form, tabel, dan alur MisiPintar sebelum migration.
- Pastikan database pengembangan dapat digunakan dan migration history konsisten.
- Sepakati klasifikasi hukum, model consent, data controller/processor, pricing, dan aturan overdue.

### Tahap 1 — Fondasi tenant dan akses (implementasi berikutnya setelah PRD disetujui)

- Entitas sekolah yang terpisah dari `FamilySpace`.
- Membership sekolah dan role sekolah yang bisa dicabut tanpa mengganti identitas akun.
- Permission server-side dan pembatasan tenant/kelas/hubungan wali.
- `/adm-panel` untuk autentikasi admin bersama dan redirect role-aware.
- Panel Platform Admin yang ada tetap tersedia; panel School Admin baru.
- Alur membuat sekolah, admin tenant, kelas, roster, undangan staf, dan audit perubahan.
- Integrasi frontend-backend untuk setiap alur tersebut beserta validasi, state UI, error, dan tes otorisasi.
- Migrasi additive; tidak mengubah XP, saldo, histori tugas, atau invoice keluarga.

**Syarat selesai Tahap 1:** Platform Admin dapat membuat sekolah; admin sekolah dapat mengelola sekolahnya; akun staf hanya melihat akses yang diberikan; percobaan lintas tenant dan akses pengguna lama tetap ditangani benar.

### Tahap 2 — Pengalaman sekolah, keluarga, dan anak

- Import siswa, kelas/tahun ajaran, invitation dan verifikasi wali.
- Dashboard guru, orang tua, dan anak.
- Misi sekolah terhubung dengan misi MisiPintar tanpa menggandakan saldo/histori.
- Review misi oleh wali/guru, XP/reward sesuai kebijakan sekolah dan keluarga.
- Notifikasi dasar, komunikasi sekolah-keluarga, serta pengaturan yang terlihat penerimanya.

### Tahap 3 — Evidence dan perkembangan

- Kompetensi/dimensi perkembangan yang terkonfigurasi.
- Observasi individual dan bulk; evidence sekolah/rumah/anak.
- Tampilan ringkasan perkembangan dan passport dengan sumber evidence, tanggal, penulis, dan status.
- Koreksi historis dengan audit; tidak menimpa atau menghilangkan jejak awal.
- Laporan anak dan keluarga.

### Tahap 4 — Langganan, billing, dan kesiapan SaaS V1

- Harga per siswa yang hanya dapat dikelola Platform Admin.
- Preview tagihan dari roster aktif yang sudah tersimpan.
- Invoice immutable, DOKU untuk invoice baru sesuai konfigurasi, webhook idempoten, dan riwayat pembayaran.
- Kebijakan tunggakan, export, audit admin, monitoring, restore backup, dan uji keamanan.

### V1.5 — Modul akademik

- Presensi, tahun ajaran/semester, mata pelajaran, kurikulum, learning outcome, asesmen, nilai, kalender, portfolio teks/refleksi, timeline perkembangan, dan insight berkala orang tua.

### V2 — Fitur lanjutan

- AI teacher copilot dan parent insight yang hanya membuat draft/saran.
- Rekomendasi kegiatan, analytics lanjutan, dukungan foundation/group multi-sekolah, serta API ekosistem.
- AI tidak menjadi prasyarat operasi sekolah dan baru boleh dipakai setelah kebijakan data, vendor, consent, dan evaluasi keselamatan disetujui.

---

## 6. Pengguna, role, dan izin

Identitas akun dapat memiliki lebih dari satu konteks. Role sekolah disimpan sebagai membership terikat sekolah, bukan hanya satu role global di akun. Satu guru dapat bekerja di beberapa sekolah; orang tua tetap terhubung ke keluarga dan hanya sekolah tempat anaknya terdaftar.

| Role | Lingkup data | Boleh | Tidak boleh |
|---|---|---|---|
| **Platform Admin** | Seluruh tenant untuk administrasi platform | Membuat/menonaktifkan sekolah, mengatur harga/fitur global, melihat status subscription, audit dan operasional. | Melihat catatan perkembangan rinci anak secara rutin; akses darurat ke data sensitif harus punya alasan dan tercatat. |
| **School Owner** | Satu sekolah yang dimiliki | Mengelola sekolah, staf, kelas, roster, pengaturan, dan melihat billing/invoice. | Mengubah harga global, membuka tenant lain, atau menghapus histori billing/evidence. |
| **School Admin** | Sekolah yang menjadi membership | Mengelola profil sekolah, staf, kelas, enrollment, undangan wali, konfigurasi dan laporan sesuai izin. | Mengubah harga/global pricing, membuat Platform Admin, atau mengakses tenant lain. |
| **Principal** | Sekolah dan siswa dalam lingkup sekolah | Melihat ringkasan sekolah dan data pendidikan yang diperlukan; meninjau aktivitas guru. | Mengubah harga atau mengakses platform global; akses evidence dibatasi tujuan pendidikan. |
| **Teacher** | Kelas/siswa yang ditugaskan | Melihat roster kelas, tugas, presensi saat tersedia, misi dan observasi kelas. | Mencari siswa global atau melihat kelas di luar assignment. |
| **Homeroom Teacher** | Kelas wali dan siswanya | Hak Teacher plus komunikasi wali dan ringkasan kelas yang ditugaskan. | Mengelola keanggotaan sekolah atau billing. |
| **Parent/Guardian** | Siswa yang hubungan walinya sudah diverifikasi | Melihat perkembangan, pengumuman, komunikasi, dan aktivitas anak yang diizinkan. | Menautkan anak secara bebas, melihat anak lain, atau melihat data kelas/sekolah yang bukan untuknya. |
| **Child** | Akun dan profilnya sendiri | Melihat misi, progres, reward, aktivitas, refleksi, dan bagian passport yang disetujui. | Melihat catatan pribadi anak lain, billing, admin sekolah, atau komunikasi yang tidak ditujukan kepadanya. |

Prinsip izin untuk setiap permintaan: **akun + role + tenant + resource + assignment/relationship + tujuan akses**. Role Platform Admin tidak boleh menjadi jalan pintas untuk mengabaikan log dan minimisasi akses.

---

## 7. Route dan perilaku autentikasi

### 7.1 Keputusan route

- `/adm-panel` adalah satu halaman masuk khusus untuk **Platform Admin dan admin tenant**.
- Setelah kredensial valid:
  - `SUPER_ADMIN` lama / Platform Admin → `/superadmin`
  - School Owner / School Admin → `/school-admin`
  - akun dengan beberapa tenant/role → halaman pemilih konteks, hanya menampilkan membership yang aktif
- `/superadmin` dan seluruh rute turunannya tetap memverifikasi role di server.
- `/school-admin` dan seluruh rute turunannya memverifikasi membership serta `schoolId` di server.
- Guru, orang tua, dan anak tetap masuk melalui alur pengguna yang sesuai; autentikasi admin tidak memberi mereka akses admin.
- Rute adalah navigasi, bukan kontrol keamanan. Mengetik URL langsung tidak boleh memberi akses.
- Login gagal tidak mengungkap apakah suatu email terdaftar. Rate limit, lockout, session expiry, logout, dan audit tetap berlaku.

### 7.2 Sesi dan pencabutan akses

- Kredensial yang ada untuk orang tua dan anak tetap berfungsi.
- Akun staf memakai akun terverifikasi dan dapat memiliki role sekolah lintas tenant.
- Server memvalidasi membership/status akses saat menjalankan operasi sensitif; tenant/role yang dikirim browser tidak dipercaya.
- Menghapus atau menangguhkan membership memutus akses sekolah itu tanpa menghapus akun keluarga atau membership sekolah lainnya.
- Pengguna dengan beberapa sekolah memilih tenant aktif; penggantian tenant mengubah lingkup seluruh request berikutnya dan tidak mempertahankan cache sensitif dari sekolah sebelumnya.

---

## 8. Perjalanan pengguna utama

### 8.1 Provisioning sekolah

1. School Owner mengajukan akun dan memverifikasi kontak.
2. Sistem membuat tenant dengan status `PENDING_REVIEW`; status ini belum membuka akses siswa.
3. Platform Admin meninjau dan mengaktifkan/menolak permohonan dengan alasan tercatat.
4. School Owner melengkapi profil, tahun ajaran, kelas, staf, dan roster.
5. Sistem menghitung jumlah siswa tertagih dari enrollment—tidak meminta angka tagihan manual.
6. Harga dan estimasi ditampilkan sebelum owner mengonfirmasi subscription.
7. Aktivasi berbayar mengikuti hasil provider pembayaran yang terverifikasi.

**Default yang diusulkan:** sekolah baru memerlukan persetujuan Platform Admin sebelum mengundang anak/orang tua. Keputusan ini menekan tenant palsu dan memberi waktu meninjau tujuan pemrosesan data anak.

### 8.2 Import roster

- CSV memerlukan nama panggilan/nama tampilan siswa, kelas/tingkat, dan tahun ajaran. Kode siswa lokal boleh digunakan untuk mencegah duplikasi.
- NIK, NISN, nomor identitas, alamat rumah, diagnosis, atau foto tidak menjadi kolom wajib.
- Kontak wali hanya diminta ketika sekolah akan mengirim undangan dan harus memiliki tujuan/persetujuan yang jelas.
- Sistem menampilkan pratinjau, jumlah data valid, baris duplikat, dan kesalahan per baris sebelum konfirmasi.
- Kesalahan struktur file membatalkan import; baris bermasalah tidak boleh masuk diam-diam.
- Konfirmasi import tercatat dan dapat diaudit. Re-import dengan kode siswa lokal yang sama tidak membuat duplikat.

### 8.3 Mengundang guru dan mengelola kelas

- Admin membuat tahun ajaran/kelas, mengundang staf, menetapkan role sekolah, dan menghubungkan guru ke kelas.
- Undangan adalah token sekali pakai dengan masa berlaku terbatas; undangan dapat dicabut dan dikirim ulang.
- Perubahan role, sekolah, assignment kelas, dan status akun tercatat di audit log.

### 8.4 Menghubungkan orang tua dan siswa

- Siswa dapat terdaftar di sekolah tanpa memiliki akun anak atau akun orang tua.
- Sekolah memulai undangan wali; parent tidak dapat mencari dan menautkan anak secara bebas.
- Sekolah memverifikasi hubungan melalui prosesnya sendiri, kemudian sistem mengeluarkan undangan/token terbatas.
- Parent menerima undangan, membuat/masuk ke akun, membaca pemberitahuan tujuan data, lalu menyetujui atau menolak tautan serta consent yang dibutuhkan.
- Catatan menyimpan status, siapa yang memverifikasi/menerima, kapan, tujuan, dan versi pemberitahuan/consent.
- Akun anak MisiPintar tidak otomatis ditautkan ke roster. Penautan dilakukan oleh wali yang sudah terverifikasi dan menghasilkan audit event.
- Jika consent dicabut atau hubungan wali dibatalkan, akses berikutnya dihentikan; histori ditangani sesuai retensi hukum dan kontrak sekolah.

### 8.5 Observasi guru

Alur cepat: pilih kelas → siswa → kompetensi → level → catatan opsional → simpan. Target uji kegunaan: median kurang dari 20 detik untuk satu observasi sederhana. Bulk observation membuat satu record evidence terpisah per siswa, dengan author, waktu, dimensi, dan sumber yang sama.

### 8.6 Misi dan reward

Misi dapat diberikan oleh orang tua atau guru kepada akun anak yang terhubung. Anak menyelesaikan misi dan refleksi; pihak yang ditentukan sekolah/keluarga meninjau; XP/reward ditambahkan tepat satu kali setelah persetujuan. Catatan misi sekolah tidak boleh menulis langsung ke saldo keluarga tanpa aturan reward dan transaksi yang jelas.

### 8.7 Tagihan sekolah

1. Billing admin melihat jumlah enrollment aktif dan harga efektif.
2. Sistem menampilkan preview periode, jumlah siswa, tarif, diskon, pajak jika berlaku, dan total.
3. Invoice menyimpan snapshot permanen.
4. Status pembayaran berubah hanya berdasarkan webhook provider yang diverifikasi atau tindakan manual beralasan dan diaudit.
5. Pemberitahuan gagal bayar dan kebijakan grace period dijalankan terpisah dari operasi inti kelas.

---

## 9. Kebutuhan fungsional

### 9.1 Tenant, sekolah, dan anggota

- Setiap School memiliki ID, nama, slug, kontak, negara, zona waktu, status, setting, dan waktu pembuatan/perubahan.
- School slug unik; School tidak memakai ID `FamilySpace` sebagai tenant.
- Membership memiliki `schoolId`, `userId`, role, status, rentang berlaku, pembuat, dan jejak perubahan.
- Pengguna dapat menjadi anggota beberapa School; hanya membership yang aktif memberi akses.
- School Admin mengelola anggota sekolah; hanya Platform Admin dapat mengaktifkan/menangguhkan tenant.
- Penghapusan entitas yang perlu histori adalah soft delete/nonaktif, bukan penghapusan fisik.

### 9.2 Siswa, enrollment, dan kelas

- Catatan siswa bersifat lokal pada sekolah dan menyimpan data minimum yang dibutuhkan.
- Enrollment mengikat siswa ke sekolah, tahun ajaran, tingkat, dan kelas dengan tanggal/status.
- Jumlah tertagih berasal dari enrollment aktif dan hanya menghitung satu siswa satu kali per sekolah pada tanggal snapshot.
- Pindah kelas tidak membuat siswa baru; riwayat kelas dan enrollment tetap dapat ditelusuri.
- Siswa yang keluar tidak muncul di roster aktif tetapi riwayat akademik/evidence tetap mengikuti kebijakan retensi.
- Pencarian siswa dibatasi tenant dan assignment pengguna.

### 9.3 Misi dan fitur MisiPintar

- Pertahankan misi, completion, parent approval, XP/level/streak, badges/achievements, reward, wallet, literasi finansial, dashboard, dan histori yang sudah berjalan.
- Reward dapat dikonfigurasi: XP saja, XP + badge, XP + reward, atau XP + virtual money.
- Sekolah dapat menentukan apakah leaderboard dipakai; default adalah tidak menampilkan leaderboard.
- Jika diaktifkan, leaderboard hanya internal kelas/sekolah, tidak publik, tidak lintas sekolah, dan identitas anak diminimalkan.
- Setiap perubahan saldo mempunyai ledger/transaksi atomik dan idempotency key agar misi yang disetujui bersamaan tidak memberi reward ganda.

### 9.4 Development Passport dan evidence

Dimensi awal yang dapat dikonfigurasi:

- **Karakter:** tanggung jawab, disiplin, kejujuran, empati, kepedulian, ketangguhan, kemandirian.
- **Pengetahuan:** literasi, numerasi, sains, bahasa, sosial, digital, literasi finansial.
- **Berpikir:** berpikir kritis, pemecahan masalah, penalaran, kreativitas, pengambilan keputusan.
- **Keterampilan:** komunikasi, kolaborasi, presentasi, keterampilan praktis dan digital.
- **Kebiasaan dan kesejahteraan:** rutinitas, aktivitas fisik, regulasi diri yang teramati, interaksi sosial, keterlibatan belajar. Tidak bersifat diagnosis.

Level deskriptif: **Belum teramati → Mulai tumbuh → Berkembang → Konsisten → Kuat**. Tampilan tidak menyatukan dimensi menjadi satu skor/ranking.

Setiap insight:

- Menyertakan evidence, sumber (sekolah/rumah/anak), penulis, tanggal, kompetensi, konteks, dan status keterlihatan.
- Menggunakan bahasa deskriptif dan berbatas waktu; contoh: “Kolaborasi mulai konsisten, didukung 4 observasi terbaru.”
- Dapat dikoreksi dengan alasan dan jejak nilai sebelumnya. Catatan historis tidak diedit diam-diam.
- Tidak menyimpulkan kekurangan atau karakter tetap tanpa evidence yang dapat ditinjau.
- Menyaring isi sesuai role; data guru tidak otomatis terlihat untuk semua orang tua atau semua guru.

### 9.5 Komunikasi dan notifikasi

- Pengumuman sekolah, pengumuman kelas, pesan guru-ke-wali, status dibaca, histori notifikasi, dan pilihan preferensi.
- Tidak ada feed sosial publik.
- Setiap pesan/announcement mengikuti teacher-class dan guardian-student scope.
- Bahasa dan kanal notifikasi dapat dikonfigurasi; kanal awal: in-app dan email. WhatsApp/SMS adalah integrasi lanjutan, bukan dependency alur utama.
- Jam tenang, mute, pengelolaan pengiriman ganda, dan log pesan disediakan sebelum komunikasi dua arah diluncurkan secara luas.

### 9.6 Billing dan pricing

- Pricing hanya dikelola Platform Admin: tarif per siswa, mata uang, siklus, tier/minimum jika disetujui, periode efektif, diskon, dan status.
- School Admin melihat count, tarif efektif, estimasi, invoice, status pembayaran, dan histori; tidak mengedit formula/status/total.
- **Aturan V1 yang diusulkan:** tagihan bulanan dihitung dari enrollment aktif pada waktu snapshot invoice, menggunakan zona waktu sekolah. Perubahan enrollment setelah snapshot berlaku pada periode berikutnya; prorata tidak termasuk V1.
- Invoice menyimpan sekolah, periode, hitungan, tarif, diskon, pajak jika berlaku, total, mata uang, tanggal buat/jatuh tempo, provider, dan status.
- Invoice lama tidak berubah ketika tarif atau jumlah siswa berubah.
- Semua nilai uang disimpan sebagai bilangan bulat unit mata uang terkecil yang sesuai; format IDR lokal saat ditampilkan.
- Pajak, diskon, minimum, dan tier hanya dihitung berdasarkan konfigurasi yang disetujui; tidak ada angka contoh dalam PRD yang otomatis menjadi harga jual.
- Webhook pembayaran diverifikasi, idempoten, dan tidak memercayai status dari browser.
- Refund/adjustment tidak boleh hanya mengubah label database: catat provider reference atau bukti tindakan manual, alasan, actor, waktu, dan audit.
- **Aturan tunggakan yang diusulkan:** status `PAST_DUE` memberi grace period konfigurabel, default 7 hari. Setelahnya, tenant dapat disuspensi dari operasi tulis; data dan akses baca/export yang dibutuhkan tidak dihapus atau dikunci otomatis. Durasi dan pembatasan harus disetujui sebelum penagihan live.
- Kegagalan provider pembayaran tidak boleh menghentikan misi/kelas atau mengubah status menjadi lunas.

### 9.7 Privacy dan hak data

- JOBEN tidak menyediakan upload foto/video aktivitas anak, galeri kelas, foto/video sebagai evidence, pengenalan wajah, facial embedding, biometric, deteksi emosi, profiling wajah, data medis/diagnosis, atau dokumen identitas anak sebagai fitur normal.
- Foto profil anak opsional, private, hanya untuk identifikasi akun, tidak dianalisis dan tidak digunakan untuk assessment.
- Data default dibatasi pada ID internal, nama tampilan, hubungan, kelas/enrollment, data yang diperlukan untuk belajar/perkembangan, dan akun. Tanggal lahir, gender, kontak wali, dan identitas eksternal hanya dikumpulkan jika ada kebutuhan dan dasar pemrosesan yang terdokumentasi.
- Persetujuan dicatat per tujuan, versi pemberitahuan, pemberi persetujuan, waktu, bukti, masa berlaku, dan status pencabutan.
- Tersedia workflow permintaan akses/koreksi/ekspor/penghapusan sesuai peran, kontrak, retensi, dan hukum.
- Ekspor data memerlukan izin, alasan, audit, link sementara, proteksi unduhan, dan expiry otomatis.
- Terdapat peta data, retensi per kategori, jadwal penghapusan, penanganan insiden, pemulihan backup, dan prosedur permintaan subjek data.
- Legal review wajib memutuskan peran controller/processor sekolah dan JOBEN, dasar pemrosesan, consent, rentang usia/fitur, verifikasi pengguna anak, risk assessment, dan desain perlindungan anak yang diwajibkan aturan yang berlaku. PRD tidak menggantikan nasihat hukum.

### 9.8 AI — V2

- AI hanya merangkum evidence, menyusun draft feedback, atau menyarankan aktivitas sesuai usia.
- Semua hasil diberi label “Draf AI” dan harus disetujui guru/orang tua yang berwenang sebelum dicatat atau dikirim.
- AI tidak mendiagnosis, menentukan disabilitas/mental health, memprofilkan anak, membuat label permanen, menghukum/memberi reward otomatis dari inferensi, atau mengambil keputusan berdampak tinggi.
- Data anak tidak digunakan untuk melatih model provider secara default.
- Prompt/output, provider, tujuan, dan approval dicatat sesuai retensi; isi sensitif diminimalkan.
- Jika AI gagal, absensi, kelas, misi, observasi, akses orang tua, laporan, dan billing tetap berjalan.

---

## 10. Model domain dan batas data

Nama tabel final akan ditetapkan saat desain migration. Batas domain yang wajib dipertahankan:

| Domain | Data utama | Batas |
|---|---|---|
| Akun keluarga | User, FamilySpace, Child, tugas, saldo, ledger | Fitur lama; tidak diubah menjadi School tenant. |
| Sekolah | School, setting, membership, invitation, audit | Setiap baris milik School dan dibatasi server-side. |
| Roster sekolah | Catatan siswa sekolah, enrollment, tahun ajaran, kelas, assignment guru | Data minimum; terpisah dari akun anak sampai hubungan sah diverifikasi. |
| Pengaitan keluarga-sekolah | Guardian/student verification dan pilihan consent; optional link ke akun Child lama | Parent tidak dapat memilih arbitrary student; tidak ada auto-match PII. |
| Belajar/perkembangan | Misi/assignment, completion, review, kompetensi, observasi, evidence, portfolio | Mencatat sumber, tenant, actor, visibilitas, waktu, dan koreksi. |
| Billing sekolah | Pricing plan, subscription sekolah, billing snapshot, invoice/items, payment events | Snapshot immutable; tidak tercampur dengan subscription keluarga. |
| Privasi dan operasi | Consent, privacy request, notification, audit, feature flags, export job | Hak minimum, retensi terdefinisi, ekspor sementara, audit non-sensitif. |

Setiap request server harus membangun lingkup akses dari session yang tervalidasi dan data membership terbaru. Tenant scope tidak berasal dari parameter browser saja. Unique constraints dan foreign keys mencegah enrollment ganda/relasi silang; transaksi database digunakan untuk operasi multi-record yang harus atomik.

---

## 11. Kontrak frontend–backend

Fitur dianggap belum terintegrasi jika hanya UI atau hanya action/API.

Setiap alur frontend wajib mempunyai kontrak backend yang jelas:

1. **Baca:** server memeriksa session, role, tenant, resource, dan hubungan; frontend menerima data minimum yang dibutuhkan.
2. **Tulis:** validasi format di client untuk kemudahan dan ulangi validasi authoritative di server; client tidak dapat mengirim role atau school scope sebagai bukti akses.
3. **Hasil:** response bertipe dengan hasil sukses atau error yang aman, dapat ditampilkan dalam Bahasa Indonesia, tanpa stack trace/PII sensitif.
4. **UI state:** loading/pending, sukses, validasi, error jaringan/izin, empty state, dan retry yang aman.
5. **Idempotensi:** pembayaran, import, persetujuan misi/reward, invitation, dan operasi tulis yang bisa diulang tidak membuat efek ganda.
6. **Audit:** perubahan sensitif memiliki actor, tenant, resource, waktu, alasan bila perlu, serta perubahan sebelum/sesudah dengan field sensitif disamarkan.
7. **Cache:** cache berisi data sensitif anak harus tenant/user scoped dan dibersihkan saat role, membership, consent, atau data berubah.
8. **UI bahasa:** seluruh label, bantuan, validasi, status, email, notifikasi, dan empty/error states memakai Bahasa Indonesia yang mudah dipahami. String visible tidak dicampur ke business logic. `id-ID` default dan `en-US` disiapkan melalui localization keys.

Semua Server Action, Route Handler, job, webhook, export, dan background task menerapkan pemeriksaan izin yang sama. Menyembunyikan tombol di frontend tidak memenuhi kontrol akses.

---

## 12. Keamanan, performa, dan operasi

### Keamanan

- TLS, password hashing aman, cookie/session yang aman, rate limit, perlindungan brute force, validasi input, output encoding, CSRF strategy, dan dependency/security scanning.
- Log tidak menyimpan password, token, secret, isi data anak yang tidak dibutuhkan, atau payload pembayaran utuh tanpa redaksi.
- Aksi tenant/global admin, perubahan role, pengaitan wali, consent, export, pricing, pembayaran, dan koreksi evidence diaudit.
- Uji eksplisit terhadap IDOR, privilege escalation, cross-tenant access, class-scope access, webhook replay, dan file path traversal.

### Performa dan keandalan

- API p95 < 500 ms untuk CRUD biasa pada beban pilot yang disepakati, tidak termasuk waktu provider eksternal.
- Query normal ditargetkan < 200 ms; dashboard memiliki konten berguna dalam < 2 detik pada beban normal.
- Laporan/export berat dijalankan asynchronous dengan status, retry aman, dan expiry.
- Pencarian selalu tenant-scoped; tidak ada pencarian siswa global dari role sekolah/guru/orang tua.
- Cache konfigurasi/pricing boleh digunakan dengan invalidasi eksplisit; jangan cache data anak secara global.
- Backup terenkripsi dan restore diuji. Target produksi awal dari PRD sumber: RPO ≤ 15 menit dan RTO ≤ 4 jam, dengan validasi biaya/kapabilitas hosting sebelum dinyatakan komitmen layanan.
- Gangguan AI, email, notifikasi, atau provider pembayaran tidak boleh menjatuhkan alur sekolah inti.

### UX dan aksesibilitas

- Mobile-first untuk Parent dan Child; dashboard staff juga berfungsi di ponsel/tablet.
- Form memiliki label jelas, keyboard support, fokus terlihat, error terhubung dengan input, kontras cukup, dan dukungan pembaca layar.
- Target pemeriksaan aksesibilitas: WCAG 2.2 AA untuk alur inti.
- Istilah teknis dijelaskan dengan bahasa pengguna; gunakan satu istilah konsisten untuk tenant, wali, kelas, enrollment, evidence, dan tagihan.

---

## 13. Kriteria penerimaan V1

### Admin dan tenant

- [ ] `/adm-panel` menerima akun Platform Admin dan School Owner/Admin yang valid.
- [ ] Setelah login, Platform Admin diarahkan ke `/superadmin`; admin sekolah diarahkan ke `/school-admin` atau pemilih sekolah bila memiliki beberapa membership.
- [ ] Akun Parent/Child tidak dapat masuk ke panel admin dan tidak memperoleh akses hanya dengan membuka URL langsung.
- [ ] Platform Admin dapat membuat, mengaktifkan, menangguhkan, dan melihat status subscription tenant.
- [ ] School Admin dapat mengubah setting, kelas, anggota, dan enrollment milik sekolahnya; tidak dapat mengubah harga global.
- [ ] Setiap request antar-tenant diuji: user School A tidak dapat membaca/mengubah data School B, termasuk dengan mengganti ID URL/request.
- [ ] Teacher/Homeroom Teacher hanya dapat membaca siswa di assignment yang berlaku.
- [ ] Penangguhan membership segera mencabut akses yang bersangkutan tanpa menghapus akun atau histori domain keluarga.

### Siswa dan keluarga

- [ ] Import roster menampilkan preview dan kesalahan per baris; duplikat tidak membuat data ganda.
- [ ] Parent hanya dapat melihat siswa setelah tautan wali diverifikasi dan consent/pemberitahuan yang diperlukan tersimpan.
- [ ] Parent A tidak dapat menampilkan data Child B/Siswa B melalui UI, Server Action, Route Handler, export, atau pencarian.
- [ ] Penautan ke akun Child lama memerlukan tindakan wali yang berwenang; migration tidak melakukan auto-match.

### Misi dan perkembangan

- [ ] Akun, misi, XP, level, streak, saldo, reward, ledger, dan histori sebelum perubahan tetap sama setelah migration.
- [ ] Approval berulang/serentak tidak membuat XP atau saldo ganda.
- [ ] Observasi individual dan bulk menghasilkan evidence yang dapat ditelusuri ke actor, tanggal, kompetensi, sumber, dan siswa.
- [ ] Perubahan/correction evidence menghasilkan audit dan mempertahankan versi sebelumnya.
- [ ] Semua insight memiliki evidence yang mendasari; tidak ada skor tunggal atau ranking publik bawaan.
- [ ] Upload media aktivitas anak ditolak oleh client dan server; foto profil tidak dapat dipakai sebagai evidence.

### Billing, privasi, dan frontend-backend

- [ ] Jumlah tertagih berasal dari enrollment aktif, bukan input manual.
- [ ] Preview, invoice, diskon, pajak yang dikonfigurasi, dan total dapat direkonsiliasi dari snapshot.
- [ ] Perubahan harga/roster tidak mengubah invoice lama.
- [ ] Webhook payment tervalidasi dan idempoten; kegagalan provider tidak menandai invoice PAID.
- [ ] Setiap halaman/form utama mempunyai loading, empty, validation, success, error, dan permission states.
- [ ] Semua mutation memvalidasi ulang role/tenant/resource di server.
- [ ] Consent, pencabutan, data export, dan privacy request menghasilkan audit event tanpa mencatat secret/PII berlebih.

### Tes wajib

- Unit test aturan billing, status enrollment, permission, reward, dan versi evidence.
- Integration test database, transaksi atomik, migration, dan webhook.
- API/server-action test per role termasuk request tidak berizin.
- E2E: Platform Admin membuat sekolah → School Admin membuat kelas dan roster → guru mencatat observasi → orang tua terverifikasi melihat anaknya → sekolah membuat snapshot tagihan.
- Security E2E: orang tua melihat siswa asing, guru membuka siswa kelas lain, dan sekolah A membuka data sekolah B; hasil harus ditolak tanpa membocorkan data.
- Regression E2E MisiPintar untuk login Parent/Child, misi, approval, saldo/ledger, histori keluarga, checkout baru, dan invoice lama.
- Uji migration pada salinan development/staging dan verifikasi hitungan data sebelum/sesudah; tidak menguji migration pertama kali pada production.

---

## 14. Definition of Done

Sebuah modul selesai hanya jika seluruh hal berikut terpenuhi:

- schema/migration dan aturan validasi ada;
- backend/action/API serta authorization tenant/role ada;
- halaman/form frontend memanggil backend yang benar;
- loading, empty, success, error, dan permission states ada;
- audit, privacy, dan localization berlaku;
- migration/regression/security test yang relevan lulus;
- mobile dan aksesibilitas alur utama diperiksa;
- dokumentasi operasional dan recovery diperbarui;
- log/metric tidak membocorkan data anak;
- tidak menimbulkan regresi pada akun/data/payment MisiPintar.

Tampilan yang selesai tanpa otorisasi dan integrasi backend bukan fitur yang selesai.

---

## 15. Keputusan yang perlu disetujui sebelum implementasi

Pilihan di bawah memakai default yang direkomendasikan dalam PRD ini; persetujuan bisnis/hukum diperlukan sebelum menulis migration atau mengaktifkan alur live.

| Keputusan | Default rekomendasi | Kenapa perlu disepakati |
|---|---|---|
| Pendaftaran dan review sekolah | School Owner mendaftar; Platform Admin menyetujui sebelum aktivasi siswa | Menentukan validasi tenant, tanggung jawab data anak, dan fraud control. |
| Model harga dan siklus | Hitung enrollment aktif saat snapshot; perubahan berlaku periode berikutnya; tanpa prorata pada V1 | Menentukan keterjelasan tagihan dan cara menangani siswa masuk/keluar di tengah periode. |
| Tunggakan | Grace period default 7 hari; setelahnya read-only terbatas, tidak ada data dihapus | Menentukan efek suspensi ke guru, wali, siswa, dan ekspor data. |
| Pajak, diskon, minimum/tier | Dikonfigurasi Platform Admin setelah finance/legal menyetujui | Tarif contoh dalam PRD sumber bukan harga final atau ketentuan pajak. |
| Relasi hukum sekolah/JOBEN | Menunggu pemetaan controller/processor, kontrak, dan instruksi pemrosesan | Menentukan consent, permintaan subjek data, breach handling, dan tanggung jawab retensi. |
| Persyaratan umur/consent anak | Menunggu kajian hukum atas UU PDP, PP 17/2025, Permenkomdigi 9/2026 dan aturan terbaru | Regulasi terbaru membahas kategori umur, verifikasi pengguna anak, penilaian risiko, dan desain perlindungan; ambang fitur tidak boleh ditebak. |
| Provider refund sekolah | Gunakan proses refund provider yang terverifikasi; jangan menandai refund hanya di database | Kapabilitas dan alur refund DOKU perlu dikonfirmasi untuk produk/langganan sekolah. |
| Kontak undangan wali | Hanya dikumpulkan saat dibutuhkan untuk undangan, dengan tujuan dan akses terbatas | Mencegah roster menjadi kumpulan PII wali yang tidak diperlukan. |
| Integrasi kurikulum/roster | Import CSV dahulu; integrasi eksternal setelah ada pilot dan kontrak teknis | Mencegah lock-in atau sinkronisasi yang membuka lintas tenant. |
| Target hosting Node dan recovery | Tetap pada lingkungan sekarang sampai kompatibilitas cPanel dan target RPO/RTO diverifikasi | Infrastruktur production berbeda dari development preview. |

---

## 16. Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| Data keluarga dan sekolah tercampur | Domain `FamilySpace` dan `School` terpisah; tautan eksplisit; tes IDOR/cross-tenant wajib. |
| Perubahan login memutus akun lama | Auth Parent/Child tidak diganti; role `SUPER_ADMIN` lama dipetakan kompatibel; regression login wajib. |
| Roster sekolah tanpa dasar pemrosesan yang jelas | Review hukum, persetujuan yang sesuai, minimisasi, dan larangan membuka akun anak sebelum policy gate. |
| Jumlah siswa dan invoice berbeda | Count dihitung dari enrollment, satu siswa dihitung sekali, timestamp snapshot tersimpan, rekonsiliasi bisa diaudit. |
| Guru tidak memakai fitur karena lambat | Observasi cepat, bulk entry, pilot usability, ukur waktu dan error rate. |
| AI memberi kesimpulan yang merugikan anak | AI V2 saja, draft yang perlu persetujuan manusia, tanpa diagnosis/keputusan otomatis. |
| Produksi cPanel tidak cocok dengan asumsi stack baru | Pertahankan pipeline saat ini; verifikasi versi runtime, memory/build budget, backup, dan deployment sebelum perubahan. |
| Fitur lama mengunggah foto/video aktivitas | Cegah upload baru di client dan server; audit file lama dan tentukan retensi sebelum tindakan pada file historis. |
| Tagihan gagal ketika provider down | Graceful failure, status server-authoritative, operasi sekolah tetap berjalan, retry webhook aman. |

---

## 17. Referensi pasar dan regulasi

Semua halaman produk berikut diakses pada 4 Oktober 2026; angka jangkauan adalah klaim yang diterbitkan oleh penyedia masing-masing.

1. ClassDojo — Family Engagement: https://www.classdojo.com/en-us/districts/solutions/family-engagement/
2. ClassDojo — halaman produk: https://www.classdojo.com/
3. Seesaw — International Schools: https://seesaw.com/international/international-schools/
4. Seesaw — Global Education Platform: https://seesaw.com/international/other-countries/
5. PowerSchool — SIS: https://www.powerschool.com/products/student-information/sis/
6. ManageBac+ — About: https://www.managebac.com/about
7. Toddle — solusi sekolah: https://www.toddleapp.com/custom-solution/
8. Pijar Sekolah: https://pijarsekolah.id/

Sumber resmi regulasi yang harus diperiksa kembali oleh penasihat hukum sebelum peluncuran:

1. Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi: https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022
2. Peraturan Pemerintah Nomor 17 Tahun 2025 tentang Tata Kelola Penyelenggaraan Sistem Elektronik dalam Pelindungan Anak: https://peraturan.bpk.go.id/Details/316698/pp-no-17-tahun-2025
3. Permenkomdigi Nomor 9 Tahun 2026 tentang Peraturan Pelaksanaan PP 17/2025: https://peraturan.bpk.go.id/Details/346040/permenkomdigi-no-9-tahun-2026

> Riset produk ini digunakan untuk mengarahkan kebutuhan dan alur, bukan untuk menyatakan JOBEN telah terbukti meningkatkan hasil belajar atau telah memenuhi seluruh kewajiban hukum.