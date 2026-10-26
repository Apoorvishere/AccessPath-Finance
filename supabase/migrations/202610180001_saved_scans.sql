-- AccessPath: signed-in, owner-only scan records. Run once in a new Supabase project.
-- Paid scan dispatch is deliberately separate from this migration.

create extension if not exists pgcrypto;

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('imported', 'live')),
  target_url text not null,
  task text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'partial', 'failed', 'cancelled')),
  report jsonb,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint scans_target_length check (length(target_url) between 12 and 2048),
  constraint scans_task_length check (length(task) between 12 and 180),
  constraint scans_report_size check (report is null or octet_length(report::text) <= 1000000),
  constraint scans_report_state check ((status in ('completed', 'partial')) = (report is not null))
);

create unique index scans_user_idempotency_idx on public.scans(user_id, idempotency_key);
create index scans_user_created_idx on public.scans(user_id, created_at desc, id desc);
create unique index scans_one_active_user_idx on public.scans(user_id) where status in ('queued', 'running');

alter table public.scans enable row level security;
revoke all on public.scans from anon, authenticated;
grant select on public.scans to authenticated;
create policy "owner reads scans" on public.scans for select to authenticated
  using ((select auth.uid()) = user_id);

-- The only client write path is this function. It checks auth.uid() itself,
-- applies a per-user daily import cap, and makes retries idempotent.
create or replace function public.save_imported_audit(
  p_target_url text,
  p_task text,
  p_report jsonb,
  p_idempotency_key uuid
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_existing uuid;
  v_id uuid;
  v_count integer;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_idempotency_key is null then raise exception 'Idempotency key required' using errcode = '22023'; end if;
  if p_target_url !~ '^https://access-path-mu[.]vercel[.]app/demo-site(/|$|[?])'
    or length(p_target_url) > 2048 then
    raise exception 'Only the controlled demo is supported' using errcode = '22023';
  end if;
  if length(btrim(p_task)) not between 12 and 180 then
    raise exception 'Invalid task length' using errcode = '22023';
  end if;
  if p_report is null or jsonb_typeof(p_report) <> 'object'
    or octet_length(p_report::text) > 1000000
    or jsonb_typeof(p_report->'pages') <> 'array' then
    raise exception 'Invalid audit report' using errcode = '22023';
  end if;
  if jsonb_array_length(p_report->'pages') not between 1 and 3 then
    raise exception 'Invalid audit page count' using errcode = '22023';
  end if;
  -- One transaction-wide lock keeps the quota check and insert atomic.
  perform pg_catalog.pg_advisory_xact_lock(20261018, 1);
  select id into v_existing from public.scans
    where user_id = v_user and idempotency_key = p_idempotency_key;
  if v_existing is not null then return v_existing; end if;
  select count(*) into v_count from public.scans
    where user_id = v_user and source = 'imported'
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  if v_count >= 10 then raise exception 'Daily saved-report limit reached' using errcode = 'P0001'; end if;
  insert into public.scans(user_id, source, target_url, task, status, report, idempotency_key, finished_at)
    values (v_user, 'imported', p_target_url, btrim(p_task), 'completed', p_report, p_idempotency_key, now())
    returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.save_imported_audit(text,text,jsonb,uuid) from public, anon;
grant execute on function public.save_imported_audit(text,text,jsonb,uuid) to authenticated;
