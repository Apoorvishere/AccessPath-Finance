-- Reserve two more team-approved demo attempts after browser integration failures.
-- The queue remains paused until the worker deployment is verified.
begin;

update public.live_scan_limits
set enabled = false,
    daily_global_cap = greatest(daily_global_cap, 6),
    lifetime_global_cap = greatest(lifetime_global_cap, 12)
where singleton = true;

commit;
