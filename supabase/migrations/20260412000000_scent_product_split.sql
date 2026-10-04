-- ============================================================
-- New tables: scents + products (replacing flat candles table)
-- ============================================================

create table public.scents (
  id text primary key default 's' || extract(epoch from now())::bigint::text || '_' || floor(random() * 1000)::int::text,
  name text not null,
  description text not null,
  category text not null references public.category_meta(name),
  "spotifyTrackId" text not null default '',
  "scentProfile" text[] not null default '{}',
  "heroImage" text not null default '',
  artist text not null default '',
  "songName" text not null default '',
  created_at timestamptz not null default now()
);
create table public.products (
  id text primary key default 'p' || extract(epoch from now())::bigint::text || '_' || floor(random() * 1000)::int::text,
  scent_id text not null references public.scents(id) on delete cascade,
  "formFactor" text not null,
  price numeric(10,2) not null,
  images text[] not null default '{}',
  stock integer not null default 0,
  created_at timestamptz not null default now()
);
-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.scents enable row level security;
alter table public.products enable row level security;
-- Public read
create policy "public read scents"
  on public.scents for select using (true);
create policy "public read products"
  on public.products for select using (true);
-- Authenticated write
create policy "auth write scents"
  on public.scents for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "auth write products"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
-- ============================================================
-- Migrate data: each candle → 1 scent + 1 product
-- ============================================================

insert into public.scents (id, name, description, category, "spotifyTrackId", "scentProfile", "heroImage", artist, "songName", created_at)
select
  's' || id,
  scent,
  description,
  category,
  "spotifyTrackId",
  "scentProfile",
  image,
  artist,
  name,
  created_at
from public.candles;
insert into public.products (id, scent_id, "formFactor", price, images, stock, created_at)
select
  'p' || id,
  's' || id,
  '8oz Jar',
  price,
  ARRAY[image],
  10,
  created_at
from public.candles;
