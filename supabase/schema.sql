create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('student', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'question_type') then
    create type public.question_type as enum ('single', 'multi');
  end if;
  if not exists (select 1 from pg_type where typname = 'attempt_status') then
    create type public.attempt_status as enum ('in_progress', 'submitted');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  full_name text not null,
  role public.user_role not null default 'student',
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_banks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  course_name text not null default '',
  description text not null default '',
  source_path text not null default '',
  total_questions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  course_name text not null default '',
  description text not null default '',
  duration_minutes integer not null default 60,
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,
  published boolean not null default true,
  bank_id uuid not null references public.question_banks(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid not null references public.question_banks(id) on delete cascade,
  number integer not null,
  type public.question_type not null,
  stem text not null,
  explanation text not null default '',
  correct_option_labels jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bank_id, number)
);

create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, label)
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  nim text not null,
  student_name text not null,
  whatsapp text not null,
  theme text not null default 'dark',
  status public.attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  submitted_at timestamptz,
  duration_minutes integer not null default 60,
  current_page integer not null default 1,
  progress_question_number integer not null default 0,
  answered_count integer not null default 0,
  total_questions integer not null default 50,
  score integer not null default 0,
  total_points integer not null default 0,
  percentage numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_labels jsonb not null default '[]'::jsonb,
  correct_option_labels jsonb not null default '[]'::jsonb,
  is_correct boolean not null default false,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists idx_questions_bank_id on public.questions(bank_id);
create index if not exists idx_options_question_id on public.options(question_id);
create index if not exists idx_attempts_exam_id on public.attempts(exam_id);
create index if not exists idx_attempts_user_id on public.attempts(user_id);
create unique index if not exists uq_attempts_exam_nim on public.attempts(exam_id, nim);
create index if not exists idx_attempt_answers_attempt_id on public.attempt_answers(attempt_id);

alter table public.users enable row level security;
alter table public.question_banks enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;

alter table public.question_banks add column if not exists course_name text not null default '';
alter table public.exams add column if not exists course_name text not null default '';
