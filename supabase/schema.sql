-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;

create policy "Allow public read access on items"
  on public.items
  for select
  to anon, authenticated
  using (true);

insert into public.items (title, description, status) values
  ('Set up Supabase', 'Create a project and connect this Next.js app', 'done'),
  ('Create items table', 'Run supabase/schema.sql in the SQL editor', 'done'),
  ('Deploy to Vercel', 'Add env vars and redeploy', 'in_progress'),
  ('Add more items', 'Insert rows from the Supabase dashboard or SQL', 'todo');
