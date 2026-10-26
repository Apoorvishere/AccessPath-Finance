alter table public.scans
  drop constraint if exists scans_report_size;

alter table public.scans
  add constraint scans_report_size
  check (report is null or octet_length(report::text) <= 2500000);
