insert into public.users (username, full_name, role, password_hash)
values
  ('dillahbaraja', 'Dr. Abdillah Baradja, S.Kom., M.Eng.', 'admin', crypt('Dillah1331', gen_salt('bf'))),
  ('student', 'Mahasiswa Demo', 'student', crypt('student123', gen_salt('bf')))
on conflict (username) do update
set full_name = excluded.full_name,
    role = excluded.role,
    password_hash = excluded.password_hash,
    updated_at = now();

