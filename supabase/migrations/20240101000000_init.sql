-- ============================================================
-- Tables
-- ============================================================

create table public.category_meta (
  name text primary key,
  subtitle text not null
);

create table public.candles (
  id text primary key,
  name text not null,
  artist text not null,
  scent text not null,
  description text not null,
  image text not null default '',
  "spotifyTrackId" text not null default '',
  price numeric(10,2) not null,
  "scentProfile" text[] not null default '{}',
  category text not null references public.category_meta(name),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Storage bucket for candle images
-- ============================================================

insert into storage.buckets (id, name, public)
values ('candle-images', 'candle-images', true)
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.category_meta enable row level security;
alter table public.candles enable row level security;

-- Public read
create policy "public read category_meta"
  on public.category_meta for select using (true);

create policy "public read candles"
  on public.candles for select using (true);

-- Authenticated write (admin only)
create policy "auth write category_meta"
  on public.category_meta for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth write candles"
  on public.candles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage policies
create policy "public read candle-images"
  on storage.objects for select
  using (bucket_id = 'candle-images');

create policy "auth upload candle-images"
  on storage.objects for insert
  with check (bucket_id = 'candle-images' and auth.role() = 'authenticated');

create policy "auth delete candle-images"
  on storage.objects for delete
  using (bucket_id = 'candle-images' and auth.role() = 'authenticated');

-- ============================================================
-- Seed: category_meta
-- ============================================================

insert into public.category_meta (name, subtitle) values
  ('Fresh',  'Bright, airy, and sun-drenched — for every kind of good day.'),
  ('Warm',   'Cozy, indulgent, and deeply comforting — like a hug in a jar.'),
  ('Floral', 'Soft petals and romantic notes — beautifully timeless.'),
  ('Earthy', 'Grounded, smoky, and mysterious — nature distilled.');

-- ============================================================
-- Seed: candles
-- ============================================================

insert into public.candles (id, name, artist, scent, description, image, "spotifyTrackId", price, "scentProfile", category) values
  ('c1',  'Golden Hour',                       'JVKE',                              'Sunset Sorbet',             'Sweet citrus meets ripe peach in this golden, sun-kissed blend that captures the last light of day.',                                    'https://picsum.photos/id/1060/800/800', '4yNk9iz9WVJikRFle3XEvn', 32, ARRAY['Citrus','Peach','Mango'],                 'Fresh'),
  ('c2',  'Eternal Sunshine',                  'Lou Val',                           'Ocean Mist',                'A breath of fresh ocean air and sun-warmed coconut, lifting your spirits like a perfect summer morning.',                            'https://picsum.photos/id/1050/800/800', '5FChOu6NfR5w7YLgDmXXnC', 30, ARRAY['Sea Salt','Fresh Air','Coconut'],         'Fresh'),
  ('c3',  'Lake Missoula',                     'Richy Mitch & The Coal Miners',     'Vanilla Pumpkin Marshmallow','Rich vanilla and spiced pumpkin wrapped in soft marshmallow — the coziest candle for cool evenings.',                              'https://picsum.photos/id/292/800/800',  '4x1dWc1GgAfC04GcTlllax', 34, ARRAY['Vanilla','Pumpkin','Marshmallow'],        'Warm'),
  ('c4',  'Weekend Friend',                    'Goth Babe',                         'Coconut Mango',             'Tropical coconut and juicy mango transport you straight to a carefree weekend getaway.',                                            'https://picsum.photos/id/429/800/800',  '2d3QlXE6FXFDeodiS66yjM', 32, ARRAY['Coconut','Mango','Tropical'],             'Fresh'),
  ('c5',  'Coast',                             'Hailee Steinfeld',                  'Ocean Mist',                'Salty sea breeze and fresh coastal air bottled into a crisp, clean burn that clears the mind.',                                     'https://picsum.photos/id/1015/800/800', '1l4iQsOZ5sOXZPMQLvouaB', 30, ARRAY['Sea Salt','Fresh Air','Driftwood'],       'Fresh'),
  ('c6',  'Sunshine, Lollipops and Rainbows',  'Lesley Gore',                       'Fruit Rings',               'Playful and sweet — a cheerful blend of mixed berries and citrus zest, pure uncomplicated joy.',                                    'https://picsum.photos/id/139/800/800',  '3bpxXrU2ZtpmN1tyVmaO6S', 28, ARRAY['Citrus','Berry','Sweet'],                'Fresh'),
  ('c7',  'Tomorrow',                          'Shakey Graves',                     'Apple Cider Donut',         'Warm apple cider and fresh-baked donut spices — the hopeful scent of autumn mornings and new beginnings.',                          'https://picsum.photos/id/312/800/800',  '7xrgjsuZwFtv25ELEMKkpl', 32, ARRAY['Apple','Cinnamon','Brown Sugar'],         'Warm'),
  ('c8',  'A Sunday Kind of Love',             'Etta James',                        'Rose',                      'A timeless rose with a soft musk heart — romantic, unhurried, and deeply comforting.',                                             'https://picsum.photos/id/152/800/800',  '0zGLlXbHlrAyBN1x6sY0rb', 34, ARRAY['Rose','Floral','Musk'],                   'Floral'),
  ('c9',  'Espresso',                          'Sabrina Carpenter',                 'Coffee',                    'Bold espresso meets warm vanilla in a rich, energizing blend for slow mornings and late nights.',                                    'https://picsum.photos/id/425/800/800',  '2qSkIjg1o9h3YT9RAgYN75', 30, ARRAY['Coffee','Espresso','Vanilla'],           'Warm'),
  ('c10', 'Lavender Haze',                     'Taylor Swift',                      'Lavender',                  'Dreamy lavender in a soft herbal haze — the scent of calm, quiet, and drifting into sleep.',                                        'https://picsum.photos/id/164/800/800',  '5jQI2r1RdgtuT8S3iG8zFC', 32, ARRAY['Lavender','Herbal','Floral'],            'Floral'),
  ('c11', 'Congratulations',                   'Mac Miller',                        'Love Spell',                'A playful mix of peach blossom and cherry with a warm musk base — celebratory and irresistibly warm.',                               'https://picsum.photos/id/1080/800/800', '1OubIZ0ARYCUq5kceYUQiO', 34, ARRAY['Peach','Cherry Blossom','Musk'],         'Floral'),
  ('c12', 'Feels Like Summer',                 'Childish Gambino',                  'Mango Coconut',             'Sun-drenched mango and creamy coconut that make every room feel like a golden summer afternoon.',                                     'https://picsum.photos/id/28/800/800',   '1FDYlHFZpKDOBjp2TaKfP6', 32, ARRAY['Mango','Coconut','Tropical'],            'Fresh'),
  ('c13', 'Wildfire',                          'Cautious Clay',                     'Fallen Leaves',             'Smoky cedarwood and autumn leaves with an ember heart — wild, warm, and beautifully free.',                                          'https://picsum.photos/id/1043/800/800', '69xOrL71OeGz5fqXFTnJ5L', 34, ARRAY['Cedarwood','Autumn Leaves','Smoke'],     'Earthy'),
  ('c14', 'I Love You So',                     'The Walters',                       'Cinnamon Buns',             'Freshly baked cinnamon buns with a sweet vanilla glaze — the most comforting scent in the world.',                                   'https://picsum.photos/id/431/800/800',  '4SqWKzw0CbA05TGszDgMlc', 32, ARRAY['Cinnamon','Vanilla','Brown Sugar'],       'Warm'),
  ('c15', 'Champagne Supernova',               'Oasis',                             'Champagne Toast',           'Bright champagne bubbles and sparkling citrus zest — effervescent, celebratory, and impossibly light.',                              'https://picsum.photos/id/667/800/800',  '6EMynpZ10GVcwVqiLZj6Ye', 36, ARRAY['Champagne','Citrus','White Flowers'],    'Fresh'),
  ('c16', 'Angel',                             'Massive Attack',                    'Black Ice',                 'Cool bergamot and smoky cedar wrapped in a deep, mysterious musk. Dark, beautiful, otherworldly.',                                   'https://picsum.photos/id/101/800/800',  '5ZCc9E9FsPlxFsLDVcgLsK', 34, ARRAY['Musk','Bergamot','Cedar'],               'Earthy'),
  ('c17', 'Better Together',                   'Jack Johnson',                      'Blueberry Cobbler',         'Sweet blueberries and golden pastry crust with warm spice — the smell of togetherness.',                                             'https://picsum.photos/id/102/800/800',  '4VywXu6umkIQ2OS0m1I79y', 30, ARRAY['Blueberry','Vanilla','Warm Spice'],      'Warm'),
  ('c18', 'Sweater Weather',                   'The Neighbourhood',                 'Sweater Weather',           'Soft cashmere and warm sandalwood with cozy spice notes — made for curling up indoors.',                                             'https://picsum.photos/id/116/800/800',  '2QjOHCTQ1Jl3zawyYOpxh6', 32, ARRAY['Cashmere','Sandalwood','Warm Spice'],    'Warm'),
  ('c19', 'Slow Dancing in a Burning Room',    'John Mayer',                        'Cedar Musk and Lavender',   'Cedarwood, soft lavender, and a warm musk that feels like slow dancing at the end of a long night.',                                  'https://picsum.photos/id/130/800/800',  '2jdAk8ATWIL3dwT47XpRfu', 36, ARRAY['Cedarwood','Lavender','Musk'],           'Earthy'),
  ('c20', 'Purple Roses',                      'Slow Funeral',                      'Wildberry Tulip',           'Wild berries and fresh tulip petals in a delicate floral blend — bittersweet and unforgettable.',                                     'https://picsum.photos/id/1084/800/800', '6wfl32rXBpn5MC3ZzZKafM', 32, ARRAY['Berry','Tulip','Fresh Floral'],          'Floral');
