import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCandleImages } from '../shared/catalogImages.ts';

const placeholder = 'https://picsum.photos/id/431/800/800';
const hero = 'https://example.supabase.co/storage/v1/object/public/candle-images/scent.jpg';
const product = 'https://example.supabase.co/storage/v1/object/public/candle-images/product.jpg';

test('uploaded scent photos preserve candle identity, price, order, and the stored image', () => {
  const candles = [{ id: 'c14', image: placeholder, price: 28 }, { id: 'c1', image: placeholder, price: 24 }];
  const resolved = resolveCandleImages(candles, [{ id: 'sc14', heroImage: hero, products: [{ images: [product] }] }]);
  assert.deepEqual(resolved, [{ ...candles[0], image: hero }, candles[1]]);
  assert.equal(candles[0].image, placeholder);
});

test('a real product photo fills in a missing or placeholder scent photo', () => {
  for (const heroImage of ['', null, placeholder]) {
    const [candle] = resolveCandleImages([{ id: 'c6', image: placeholder }], [
      { id: 'sc6', heroImage, products: [{ images: null }, { images: ['', placeholder, product] }] },
    ]);
    assert.equal(candle.image, product);
  }
});

test('direct candle uploads take priority and unrelated scents never supply a photo', () => {
  const candles = [{ id: 'c14', image: product }, { id: 'c4', image: placeholder }];
  assert.deepEqual(resolveCandleImages(candles, [
    { id: 'sc14', heroImage: hero, products: [] },
    { id: 'sc40', heroImage: hero, products: [] },
  ]), candles);
  assert.deepEqual(resolveCandleImages(candles, []), candles);
});
