-- Run after 202610180001_saved_scans.sql. The paid queue starts DISABLED.
-- Only the controlled Northstar demo can be queued in this release.

begin;

alter table public.scans
  add column if not exists journey jsonb,
  add column if not exists started_at timestamptz,
  add column if not exists failure_code text;

alter table public.scans
  add constraint scans_journey_size check (journey is null or octet_length(journey::text) <= 30000),
  add constraint scans_failure_code_size check (failure_code is null or length(failure_code) <= 80);

create index scans_live_queue_idx on public.scans(created_at, id)
  where source = 'live' and status = 'queued';

create table public.live_scan_limits (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  daily_global_cap integer not null default 1 check (daily_global_cap between 0 and 20),
  lifetime_global_cap integer not null default 3 check (lifetime_global_cap between 0 and 100)
);
insert into public.live_scan_limits(singleton) values (true);
alter table public.live_scan_limits enable row level security;
revoke all on public.live_scan_limits from public, anon, authenticated;

-- Early paid preview is invite-only. No public client can grant access.
create table public.live_scan_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);
alter table public.live_scan_access enable row level security;
revoke all on public.live_scan_access from public, anon, authenticated;

-- Serializing submissions makes the account and global caps atomic across
-- multiple Vercel instances. A retry with the same key returns the same scan.
create function public.enqueue_live_scan(
  p_target_url text,
  p_task text,
  p_idempotency_key uuid
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_existing uuid;
  v_existing_source text;
  v_id uuid;
  v_limits public.live_scan_limits%rowtype;
  v_today timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_idempotency_key is null then raise exception 'Idempotency key required' using errcode = '22023'; end if;
  if p_target_url is null or p_target_url <> 'https://access-path-mu.vercel.app/demo-site' then
    raise exception 'Only the controlled demo is supported' using errcode = '22023';
  end if;
  if p_task is null or length(btrim(p_task)) not between 12 and 180 or p_task ~ '[[:cntrl:]]' then
    raise exception 'Invalid visitor goal' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(20261018, 2);
  select id, source into v_existing, v_existing_source from public.scans
    where user_id = v_user and idempotency_key = p_idempotency_key;
  if v_existing is not null then
    if v_existing_source <> 'live' then raise exception 'Idempotency key belongs to another operation' using errcode = '22023'; end if;
    return v_existing;
  end if;

  select * into v_limits from public.live_scan_limits where singleton = true;
  if not found or not v_limits.enabled then
    raise exception 'Live scans are paused' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.live_scan_access where user_id = v_user) then
    raise exception 'Account is not invited to the live preview' using errcode = 'P0006';
  end if;
  if (select count(*) from public.scans where user_id = v_user and source = 'live'
      and created_at >= v_today) >= 1 then
    raise exception 'Account daily limit reached' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.scans where user_id = v_user and status in ('queued', 'running')) then
    raise exception 'Account already has an active scan' using errcode = 'P0003';
  end if;
  if (select count(*) from public.scans where source = 'live' and created_at >= v_today)
      >= v_limits.daily_global_cap then
    raise exception 'Daily scan budget reached' using errcode = 'P0004';
  end if;
  if (select count(*) from public.scans where source = 'live') >= v_limits.lifetime_global_cap then
    raise exception 'Total scan budget reached' using errcode = 'P0005';
  end if;

  insert into public.scans(user_id, source, target_url, task, status, idempotency_key)
    values (v_user, 'live', p_target_url, btrim(p_task), 'queued', p_idempotency_key)
    returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.enqueue_live_scan(text,text,uuid) from public, anon;
grant execute on function public.enqueue_live_scan(text,text,uuid) to authenticated;

-- A worker can claim each queued scan once. Running scans are not automatically
-- retried after a crash, so a provider charge cannot silently happen twice.
create function public.claim_live_scan()
returns table(scan_id uuid, target_url text, task text)
language plpgsql security definer set search_path = ''
as $$
begin
  if not coalesce((select enabled from public.live_scan_limits where singleton = true), false) then
    return;
  end if;
  return query
    update public.scans s
      set status = 'running', started_at = now()
      where s.id = (
        select q.id from public.scans q
          where q.source = 'live' and q.status = 'queued'
          order by q.created_at, q.id
          for update skip locked limit 1
      )
      returning s.id, s.target_url, s.task;
end;
$$;
revoke all on function public.claim_live_scan() from public, anon, authenticated;
grant execute on function public.claim_live_scan() to service_role;
grant select, update on public.scans to service_role;

commit;
