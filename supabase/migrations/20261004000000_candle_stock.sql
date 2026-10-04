-- Stock belongs to the catalog used by both the storefront and candle editor.
-- Existing and newly created candles start with one available unit.
-- Administrators can change the count, including setting zero for sold out.
alter table public.candles
  add column stock integer not null default 1
  constraint candles_stock_nonnegative check (stock >= 0);
