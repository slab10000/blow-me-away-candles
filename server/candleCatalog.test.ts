import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCandleCatalog, requireCandleStock } from '../shared/candleCatalog.ts';
import type { Candle } from '../types.ts';

const candle: Candle = {
  id: 'c1', name: 'Golden Hour', artist: 'JVKE', scent: 'Sunset Sorbet',
  description: '', image: '', spotifyTrackId: '', price: 32, stock: 1,
  scentProfile: [], category: 'Fresh',
};
const deferred = () => {
  let resolve!: (rows: Candle[]) => void;
  const promise = new Promise<Candle[]>(done => { resolve = done; });
  return { promise, resolve };
};

test('missing stock is a load error, never a default unit or sold-out value', () => {
  for (const stock of [undefined, null, -1, 1.5, '1']) {
    assert.throws(() => requireCandleStock({ ...candle, stock: stock as number }), /availability could not be loaded/);
  }
  assert.equal(requireCandleStock(candle).stock, 1);
  assert.equal(requireCandleStock({ ...candle, stock: 0 }).stock, 0);
});

test('saving stock invalidates storefront and admin snapshots before navigation', async () => {
  let stock = 0;
  const catalog = createCandleCatalog(async () => [{ ...candle, stock }]);
  await catalog.fetch(true);
  await catalog.fetch(false);
  stock = 1;
  catalog.invalidate();
  assert.equal(catalog.snapshot(true), undefined);
  assert.equal(catalog.snapshot(false), undefined);
  assert.equal((await catalog.fetch(false))[0].stock, 1);
  assert.equal((await catalog.fetch(true))[0].stock, 1);
});

test('a response started before an admin save cannot restore stale stock', async () => {
  const beforeSave = deferred();
  const afterSave = deferred();
  let requests = 0;
  const catalog = createCandleCatalog(() => ++requests === 1 ? beforeSave.promise : afterSave.promise);
  const oldRequest = catalog.fetch(true);
  assert.equal(catalog.fetch(true), oldRequest);
  catalog.invalidate();
  const freshRequest = catalog.fetch(true);
  beforeSave.resolve([{ ...candle, stock: 0 }]);
  afterSave.resolve([candle]);
  assert.equal((await freshRequest)[0].stock, 1);
  assert.equal((await oldRequest)[0].stock, 1);
  assert.equal(catalog.snapshot(true)?.[0].stock, 1);
  assert.equal(requests, 2);
});

test('a response missing the stock column cannot be cached as a valid catalog', async () => {
  let stock: number | undefined;
  const catalog = createCandleCatalog(async () => [{ ...candle, stock: stock as number }]);
  await assert.rejects(catalog.fetch(false), /availability could not be loaded/);
  assert.equal(catalog.snapshot(false), undefined);
  stock = 1;
  assert.equal((await catalog.fetch(false))[0].stock, 1);
});
