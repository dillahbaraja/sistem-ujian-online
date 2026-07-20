alter table public.attempts
  alter column user_id drop not null;

alter table public.attempts
  add column if not exists nim text;

alter table public.attempts
  add column if not exists student_name text;

alter table public.attempts
  add column if not exists whatsapp text;

alter table public.attempts
  add column if not exists theme text not null default 'dark';

alter table public.attempts
  add column if not exists current_page integer not null default 1;

alter table public.attempts
  add column if not exists progress_question_number integer not null default 0;

alter table public.attempts
  add column if not exists answered_count integer not null default 0;

alter table public.attempts
  add column if not exists total_questions integer not null default 50;

update public.attempts
set nim = coalesce(nim, user_id::text),
    student_name = coalesce(student_name, 'Admin'),
    whatsapp = coalesce(whatsapp, ''),
    theme = coalesce(theme, 'dark'),
    current_page = coalesce(current_page, 1),
    progress_question_number = coalesce(progress_question_number, 0),
    answered_count = coalesce(answered_count, 0),
    total_questions = coalesce(total_questions, 50)
where nim is null;

alter table public.attempts
  alter column nim set not null;

alter table public.attempts
  alter column student_name set not null;

alter table public.attempts
  alter column whatsapp set not null;

create unique index if not exists uq_attempts_exam_nim on public.attempts(exam_id, nim);
