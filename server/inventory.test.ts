import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableStock, quantityLimit, reconcileCart, updateCartQuantity } from '../shared/inventory.ts';
import { buildOrderLines } from './catalog.ts';
import type { CartItem } from '../shared/commerce.ts';

const candles = [{ id: 'rose', stock: 2, price: 32 }, { id: 'vanilla', stock: 30, price: 28 }];

test('two available candles cap additions and direct quantity edits at two', () => {
  let cart: CartItem[] = [];
  for (let i = 0; i < 10; i++) cart = updateCartQuantity(cart, candles, 'rose', (cart[0]?.quantity || 0) + 1);
  assert.deepEqual(cart, [{ id: 'rose', quantity: 2 }]);
  assert.deepEqual(updateCartQuantity(cart, candles, 'rose', 100), cart);
  assert.deepEqual(updateCartQuantity(cart, candles, 'rose', 1), [{ id: 'rose', quantity: 1 }]);
  assert.deepEqual(updateCartQuantity(cart, candles, 'rose', 0), []);
  assert.deepEqual(updateCartQuantity([], candles, 'missing', 1), []);
  for (const quantity of [-1, 0.5, NaN, Infinity]) assert.equal(updateCartQuantity(cart, candles, 'rose', quantity), cart);
});

test('the existing total order limit applies alongside individual stock limits', () => {
  const cart = [{ id: 'rose', quantity: 1 }, { id: 'vanilla', quantity: 23 }];
  assert.equal(quantityLimit(cart, candles[0]), 1);
  assert.deepEqual(updateCartQuantity(cart, candles, 'rose', 2), cart);
  assert.equal(quantityLimit([{ id: 'rose', quantity: 2 }], candles[1]), 22);
});

test('restored carts and stock changes clamp quantities and remove unavailable candles', () => {
  const cart = [{ id: 'rose', quantity: 7 }, { id: 'vanilla', quantity: 2 }, { id: 'deleted', quantity: 1 }];
  const reconciled = reconcileCart(cart, candles);
  assert.deepEqual(reconciled, [{ id: 'rose', quantity: 2 }, { id: 'vanilla', quantity: 2 }]);
  assert.equal(reconcileCart(reconciled, candles), reconciled);
  assert.deepEqual(reconcileCart(reconciled, [{ ...candles[0], stock: 1 }, { ...candles[1], stock: 0 }]), [{ id: 'rose', quantity: 1 }]);
  assert.deepEqual(reconcileCart(cart, []), []);
});

test('missing, invalid, or sold-out inventory cannot be purchased', () => {
  for (const stock of [undefined, null, -1, 0, 1.5, NaN, Infinity, '2']) {
    const candle = { ...candles[0], name: 'Rose', image: '', stock: stock as number };
    assert.equal(availableStock(candle), 0);
    assert.throws(() => buildOrderLines([{ id: 'rose', quantity: 1 }], [candle]), { code: 'CART_CHANGED' });
  }
  for (const price of [0, -1, NaN, Infinity]) assert.equal(availableStock({ ...candles[0], price }), 0);
  assert.equal(availableStock(undefined), 0);
});
