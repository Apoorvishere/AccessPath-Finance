-- Allow a small number of additional team-approved demo runs.
-- Keep the queue paused until the current deployment and key balance are checked.
begin;

update public.live_scan_limits
set enabled = false,
    daily_global_cap = greatest(daily_global_cap, 4),
    lifetime_global_cap = greatest(lifetime_global_cap, 8)
where singleton = true;

commit;
