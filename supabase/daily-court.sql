-- Run after caption-court.sql. Re-runnable; retains all existing captions and votes.
begin;
create table if not exists public.daily_court_sessions (
  session_date date primary key,
  case_id uuid not null unique references public.court_cases(id) on delete cascade,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  check (closes_at > opens_at)
);
alter table public.daily_court_sessions enable row level security;
revoke all on public.daily_court_sessions from anon, authenticated;
grant select on public.daily_court_sessions to anon, authenticated;
grant all on public.daily_court_sessions to service_role;
drop policy if exists "Read daily court schedule" on public.daily_court_sessions;
create policy "Read daily court schedule" on public.daily_court_sessions for select to anon, authenticated
  using (opens_at <= now() and exists (select 1 from public.court_cases where id = case_id and status = 'ready'));

-- One shared, immutable selection per NY calendar day. No cron required.
-- The page opens today's session on its first visit; empty days await new evidence.
create or replace function public.ensure_daily_court()
returns setof public.daily_court_sessions language plpgsql security definer set search_path = '' as $$
declare
  court_day date := (now() at time zone 'America/New_York')::date;
  starts timestamptz := (court_day::timestamp at time zone 'America/New_York');
  ends timestamptz := ((court_day::timestamp + interval '20 hours') at time zone 'America/New_York');
  selected_case uuid;
begin
  perform pg_advisory_xact_lock(7120301);
  if not exists (select 1 from public.daily_court_sessions where session_date = court_day) and now() < ends then
    select c.id into selected_case from public.court_cases c
    where c.status = 'ready'
      and exists (select 1 from public.captions cap where cap.case_id = c.id)
      and not exists (select 1 from public.daily_court_sessions s where s.case_id = c.id)
    order by c.created_at asc, c.id asc limit 1;
    if selected_case is not null then
      insert into public.daily_court_sessions(session_date,case_id,opens_at,closes_at)
      values (court_day,selected_case,starts,ends);
    end if;
  end if;
  return query select * from public.daily_court_sessions where session_date = court_day;
end $$;
revoke all on function public.ensure_daily_court() from public, anon, authenticated;
grant execute on function public.ensure_daily_court() to service_role;

-- Stops late votes through either the app or a direct Supabase API request.
create or replace function public.enforce_daily_court_deadline()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.caption_id is distinct from old.caption_id or new.user_id is distinct from old.user_id) then
    raise exception 'Vote identity cannot be changed' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.captions c join public.daily_court_sessions s on s.case_id = c.case_id
    where c.id = new.caption_id and (now() < s.opens_at or now() >= s.closes_at)
  ) then
    raise exception 'COURT_CLOSED: The jury has spoken. Voting on this daily case is closed.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.enforce_daily_court_deadline() from public, anon, authenticated;
drop trigger if exists enforce_daily_court_deadline on public.caption_votes;
create trigger enforce_daily_court_deadline before insert or update on public.caption_votes
for each row execute function public.enforce_daily_court_deadline();
commit;
