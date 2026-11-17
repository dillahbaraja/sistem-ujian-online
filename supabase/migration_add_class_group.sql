-- Migration: Add class_group to attempts table for Class Shift (Pagi / Sore)
alter table public.attempts
  add column if not exists class_group text not null default 'Pagi';

-- Update all existing records (e.g. earlier submissions) to default to 'Pagi'
update public.attempts
set class_group = 'Pagi'
where class_group is null;
