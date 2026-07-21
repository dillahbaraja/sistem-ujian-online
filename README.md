# Sistem Ujian Online

Next.js + Supabase + Vercel web app for multiple exam banks in Markdown, including `bank-soal-rpl-online.md` and `bank-soal-pbo-java.md`.

## Fitur

- Login mahasiswa dan admin
- Daftar ujian
- Timer ujian
- Shuffle soal dan opsi
- Submit jawaban dan skor otomatis
- Dashboard admin
- Import bank soal Markdown ke Supabase
- Dukungan beberapa mata kuliah dari beranda dan dashboard admin

## Jalankan lokal

```bash
npm install
npm run dev
```

Demo lokal memakai bank soal Markdown yang ada di folder ini dan akun bawaan:

- Student: `student` / `student123`
- Admin: `admin` / `admin123`

## Supabase

1. Buat project Supabase.
2. Jalankan `supabase/schema.sql`.
3. Jika database sudah pernah dipakai, jalankan juga `supabase/migration_multi_course.sql`.
4. Opsional jalankan `supabase/seed.sql` untuk akun awal.
5. Isi `.env.local`:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=some-long-random-string
```

6. Buka `/admin/import` lalu tekan import untuk mengisi semua bank soal Markdown yang terdaftar.

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import ke Vercel.
3. Set env vars yang sama seperti di atas.
4. Deploy.
