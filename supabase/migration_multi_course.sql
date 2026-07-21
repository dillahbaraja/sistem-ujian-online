alter table public.question_banks
  add column if not exists course_name text not null default '';

alter table public.exams
  add column if not exists course_name text not null default '';
