# Sistem Ujian Online

Web ujian online berbasis Next.js + Supabase + Vercel untuk beberapa mata kuliah. Saat ini bank soal Markdown yang didukung adalah:

- `bank-soal-rpl-online.md` untuk `UAS Rekayasa Perangkat Lunak Semester II`
- `bank-soal-pbo-java.md` untuk `UAS Pemrograman Berorientasi Objek Semester II`

## Fitur

- Login mahasiswa dan admin
- Pilih mata kuliah dari halaman beranda
- Satu mahasiswa hanya bisa mengikuti ujian sekali per mata kuliah
- Timer ujian
- Shuffle soal dan opsi
- Submit jawaban dan skor otomatis
- Dashboard admin
- Import bank soal Markdown ke Supabase
- Dashboard admin dengan filter mata kuliah untuk melihat peserta
- Default tampilan light mode dengan kontras warna yang lebih tegas

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

6. Buka `/admin/import` lalu tekan import untuk menyinkronkan semua bank soal Markdown yang terdaftar ke `question_banks`, `exams`, `questions`, dan `options`.

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import ke Vercel.
3. Set env vars yang sama seperti di atas.
4. Deploy.
