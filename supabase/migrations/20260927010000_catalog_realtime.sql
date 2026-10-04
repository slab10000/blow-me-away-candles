-- The storefront subscribes to candle changes after admin edits.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'candles'
  ) then
    alter publication supabase_realtime add table public.candles;
  end if;
end;
$$;
