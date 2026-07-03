# MoM Read Receipt

Sistem bukti sosialisasi digital untuk HR: karyawan membaca dokumen, dites
pemahamannya lewat kuis otomatis (dibuat AI), lalu tanda tangan digital
tersimpan sebagai bukti — jadi tidak ada lagi "belum disosialisasikan".

**Versi ini sengaja dibuat paling sederhana dari sisi jumlah akun** — kamu
cuma perlu mengurus **3 layanan**: GitHub (simpan kode), Vercel (hosting
*dan* database jadi satu dashboard), dan Anthropic (AI generate kuis).
Tidak ada Firebase, tidak ada Supabase terpisah, tidak ada file kredensial
yang perlu di-download dan dicari-cari.

---

## 1. Push ke GitHub

1. Buat repository baru di GitHub (boleh **Private**).
2. Di folder project ini, jalankan:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: MoM Read Receipt"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```

## 2. Deploy ke Vercel

1. Buat akun gratis di [vercel.com](https://vercel.com), login pakai akun GitHub.
2. **Add New → Project** → pilih repo yang baru kamu push → **Deploy**
   (untuk sekarang biarkan error dulu kalau muncul, itu wajar karena
   database belum disambungkan — lanjut ke langkah 3).

## 3. Sambungkan database (langsung di dalam Vercel, tanpa akun baru)

1. Di halaman project kamu di Vercel, klik tab **Storage** di bagian atas.
2. Klik **Create Database** → pilih **Postgres** (biasanya dari Neon) →
   ikuti wizard singkatnya → **Connect** ke project ini.
   Vercel otomatis menambahkan environment variable koneksinya sendiri —
   kamu tidak perlu copy-paste apapun.
3. Masih di tab **Storage**, klik database yang baru dibuat → cari tab
   **Query** (atau "Data" / "SQL Editor", tergantung provider-nya) → buka
   file `db/schema.sql` dari project ini, copy semua isinya, paste di sana
   → **Run**. Ini membuat 2 tabel yang dibutuhkan aplikasi.

## 4. Isi 3 environment variable terakhir

1. Di project Vercel → **Settings → Environment Variables**, tambahkan:
   - `ANTHROPIC_API_KEY` — dari [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
   - `ANTHROPIC_MODEL` — cek nama model terbaru di [docs.claude.com](https://docs.claude.com), contoh: `claude-sonnet-5`
   - `HR_PASSWORD` — buat password sendiri yang kuat, dipakai tim HR login ke dashboard
2. Buka tab **Deployments** → klik titik tiga (⋯) di deployment terbaru →
   **Redeploy**, supaya environment variable yang baru diisi ini terpakai.

Setelah redeploy selesai, kamu dapat URL publik seperti
`https://nama-project.vercel.app` — **ini yang dishare ke karyawan**.

Setiap kali ada perubahan kode yang di-push ke GitHub, Vercel otomatis
deploy ulang. Tidak perlu upload manual lagi.

## 5. Jalankan di komputer sendiri dulu (opsional)

```bash
npm install -g vercel        # sekali saja
vercel link                  # hubungkan folder ini ke project Vercel kamu
vercel env pull .env.local   # ambil semua env var (termasuk database) otomatis
npm install
npm run dev
```
Buka `http://localhost:3000`.

---

## Cara pakai setelah live

- **Karyawan**: buka link Vercel-nya → isi nama sekali → pilih dokumen →
  baca → kuis → tanda tangan digital tersimpan.
- **HR**: buka link yang sama → klik "Dashboard HR" → masukkan password →
  buat dokumen baru (bisa upload PDF/Excel/CSV, kuis dibuat otomatis oleh
  AI) → lihat siapa saja yang sudah/belum konfirmasi.

## Yang perlu ditingkatkan sebelum dipakai untuk data sensitif skala besar

- **Login HR**: sekarang satu password untuk semua HR. Untuk skala lebih
  besar, pertimbangkan sistem akun terpisah per staf HR.
- **Identitas karyawan**: sekarang cuma isi nama bebas. Idealnya
  dihubungkan ke sistem HRIS/SSO kantor supaya tidak bisa dipalsukan.
- **Distribusi otomatis**: tambahkan integrasi WhatsApp Business API atau
  email untuk mengirim link dokumen otomatis ke karyawan, plus reminder
  untuk yang belum konfirmasi.
- **Export laporan**: tombol export ke Excel/PDF di dashboard untuk
  keperluan audit/arsip.
- **Custom domain**: di Vercel, tambahkan domain sendiri (mis.
  `sosialisasi.namaperusahaan.com`) supaya lebih profesional dan
  dipercaya karyawan.
