# Sistem Ujian Online RPL

Next.js + Supabase + Vercel web app for the RPL exam bank in `bank-soal-rpl-online.md`.

## Fitur

- Login mahasiswa dan admin
- Daftar ujian
- Timer ujian
- Shuffle soal dan opsi
- Submit jawaban dan skor otomatis
- Dashboard admin
- Import bank soal Markdown ke Supabase

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
3. Opsional jalankan `supabase/seed.sql` untuk akun awal.
4. Isi `.env.local`:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=some-long-random-string
```

5. Buka `/admin/import` lalu tekan import untuk mengisi bank soal dari Markdown.

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import ke Vercel.
3. Set env vars yang sama seperti di atas.
4. Deploy.

