-- Optional deployment storage. Local Vite stores orders in .local-orders/ instead.
create table if not exists public.checkout_orders (
  id uuid primary key,
  created_at timestamptz not null default now(),
  payload jsonb not null
);
alter table public.checkout_orders enable row level security;
-- Customer details are only accessible through the server service role.
revoke all on public.checkout_orders from anon, authenticated;
grant select, insert on public.checkout_orders to service_role;
