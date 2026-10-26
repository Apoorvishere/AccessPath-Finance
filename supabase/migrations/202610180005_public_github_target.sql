-- Add the owned public GitHub repository while keeping paid scans paused and existing budgets unchanged.
begin;

update public.live_scan_limits set enabled = false where singleton = true;

create or replace function public.enqueue_live_scan(
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
  if p_target_url is null or p_target_url not in ('https://access-path-mu.vercel.app/demo-site', 'https://github.com/Apoorvishere/AccessPath') then
    raise exception 'Only approved public demo sites are supported' using errcode = '22023';
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
      and created_at >= v_today and not (status = 'cancelled' and started_at is null)) >= 2 then
    raise exception 'Account daily limit reached' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.scans where user_id = v_user and status in ('queued', 'running')) then
    raise exception 'Account already has an active scan' using errcode = 'P0003';
  end if;
  if (select count(*) from public.scans where source = 'live' and created_at >= v_today
      and not (status = 'cancelled' and started_at is null)) >= v_limits.daily_global_cap then
    raise exception 'Daily scan budget reached' using errcode = 'P0004';
  end if;
  if (select count(*) from public.scans where source = 'live'
      and not (status = 'cancelled' and started_at is null)) >= v_limits.lifetime_global_cap then
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

commit;


