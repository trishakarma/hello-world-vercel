-- Run after profiles.sql in Supabase SQL Editor. Re-runnable.
begin;

-- Enable RLS on every existing public table; tables without policies deny access.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
-- The old assignment's items table is no longer used in the UI.
do $$ begin
  if to_regclass('public.items') is not null then
    drop policy if exists "Allow public read access on items" on public.items;
  end if;
end $$;
alter table public.profiles enable row level security;
drop policy if exists "Profile owner reads" on public.profiles;
drop policy if exists "Profile owner updates" on public.profiles;
create policy "Profile owner reads" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Profile owner updates" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create table if not exists public.court_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  theme text not null check (theme in ('Campus chaos', 'NYC side quest', 'Anything goes')),
  description text,
  vision_prompt text not null,
  caption_prompt text,
  model text not null,
  status text not null default 'pending' check (status in ('pending','ready','failed')),
  created_at timestamptz not null default now()
);
create table if not exists public.captions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.court_cases(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 240)
);
create table if not exists public.caption_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  caption_id uuid not null references public.captions(id) on delete cascade,
  value smallint not null check (value in (-1,1)),
  created_at timestamptz not null default now(),
  unique (user_id, caption_id)
);
create index if not exists captions_case_idx on public.captions(case_id);
create index if not exists votes_caption_idx on public.caption_votes(caption_id);
create index if not exists court_cases_user_date_idx on public.court_cases(user_id, created_at);
alter table public.court_cases enable row level security;
alter table public.captions enable row level security;
alter table public.caption_votes enable row level security;
-- Explicit privileges prevent operations such as TRUNCATE which RLS does not cover.
revoke all on public.court_cases, public.captions, public.caption_votes from anon, authenticated;
grant select on public.court_cases, public.captions to anon, authenticated;
grant select, insert, update on public.caption_votes to authenticated;
grant all on public.court_cases, public.captions, public.caption_votes to service_role;
revoke all on public.profiles from anon;
revoke insert, delete, truncate, references, trigger on public.profiles from authenticated;
grant select, update on public.profiles to authenticated;
drop policy if exists "Ready cases are readable" on public.court_cases;
create policy "Ready cases are readable" on public.court_cases for select to anon, authenticated using (status = 'ready');
drop policy if exists "Ready captions are readable" on public.captions;
create policy "Ready captions are readable" on public.captions for select to anon, authenticated using (exists (select 1 from public.court_cases c where c.id = case_id and c.status = 'ready'));
drop policy if exists "Read own votes" on public.caption_votes;
create policy "Read own votes" on public.caption_votes for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Insert own votes" on public.caption_votes;
create policy "Insert own votes" on public.caption_votes for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.captions where id = caption_id));
drop policy if exists "Update own votes" on public.caption_votes;
create policy "Update own votes" on public.caption_votes for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and exists (select 1 from public.captions where id = caption_id));
-- No client insert/update/delete policies on generations: only server can publish AI output.

-- Remove the previous daily-cap helper. The authenticated server opens cases directly.
drop function if exists public.reserve_court_case(uuid,text,text,text,text);

create or replace function public.publish_court_case(p_case uuid, p_description text, p_prompt text, p_captions text[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if cardinality(p_captions) <> 3 then raise exception 'Three captions required'; end if;
  update public.court_cases set description = p_description, caption_prompt = p_prompt, status = 'ready' where id = p_case and status = 'pending';
  if not found then raise exception 'Case is not pending'; end if;
  insert into public.captions(case_id,content) select p_case, unnest(p_captions);
end $$;
revoke all on function public.publish_court_case(uuid,text,text,text[]) from public, anon, authenticated;
grant execute on function public.publish_court_case(uuid,text,text,text[]) to service_role;

-- Aggregate only: never expose another voter's identity.
create or replace function public.court_scores()
returns table(caption_id uuid, score bigint, votes bigint) language sql stable security definer set search_path = '' as $$
  select c.id, coalesce(sum(v.value),0)::bigint, count(v.id)
  from public.captions c join public.court_cases cc on cc.id = c.case_id and cc.status = 'ready'
  left join public.caption_votes v on v.caption_id = c.id group by c.id;
$$;
revoke all on function public.court_scores() from public;
grant execute on function public.court_scores() to anon, authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('court-evidence','court-evidence',false,3145728,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=3145728, allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Read published evidence" on storage.objects;
create policy "Read published evidence" on storage.objects for select to anon, authenticated using (bucket_id = 'court-evidence' and exists (select 1 from public.court_cases where image_path = name and status = 'ready'));
-- Upload is server-only. Existing avatar folder ownership policies remain in place.

commit;
