import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createCheckout } from './checkout.ts';
import { localOrderStore } from './orderStore.ts';
import type { OrderStore, SavedOrder } from './orderStore.ts';
import type { CheckoutQuote, OrderReceipt } from '../shared/commerce.ts';
import { parseCart, parseCustomer } from '../shared/commerce.ts';
import { buildOrderLines } from './catalog.ts';

const customer = { fullName: 'Test Shopper', email: 'shopper@example.com', address1: '123 Test Street', address2: 'Apt 2', city: 'Chicago', state: 'IL', zip: '60622', country: 'US' };
const items = [{ id: 'candle-1', quantity: 2 }, { id: 'candle-2', quantity: 1 }];
function setup(store?: OrderStore) {
  const saved = new Map<string, SavedOrder>();
  let clock = Date.now();
  let price = 2599;
  let stock = 10;
  const checkout = createCheckout({
    env: { CHECKOUT_SIGNING_SECRET: 'a'.repeat(32) },
    store: store || { find: async id => saved.get(id) || null, save: async (id, order) => { if (!saved.has(id)) saved.set(id, order); return saved.get(id)!; } },
    catalog: async cart => buildOrderLines(cart, items.map(item => ({ id: item.id, name: 'A candle', image: '', price: price / 100, stock }))),
    getRates: async () => [{ service: 'USPS_GROUND_ADVANTAGE', label: 'USPS Ground Advantage', unitAmountCents: 875 }, { service: 'PRIORITY_MAIL', label: 'USPS Priority Mail', unitAmountCents: 1230 }],
    now: () => clock,
  });
  return { checkout, saved, advance: () => { clock += 16 * 60000; }, changePrice: () => { price += 100; }, setStock: (value: number) => { stock = value; } };
}
const quoteBody = { action: 'quote', items, customer };
const orderBody = (quote: CheckoutQuote) => ({ action: 'order', items, customer, quoteToken: quote.options[0].token, idempotencyKey: randomUUID() });

test('server totals use integer cents and shipping covers every candle', async () => {
  const { checkout } = setup();
  const quote = await checkout({ ...quoteBody, subtotalCents: 1, items: items.map(item => ({ ...item, price: 0.01 })) }) as CheckoutQuote;
  assert.equal(quote.subtotalCents, 7797);
  assert.equal(quote.options[0].amountCents, 2625);
  assert.equal(quote.options[0].packageCount, 3);
  const receipt = await checkout({ ...orderBody(quote), shippingCents: 0, totalCents: 1 }) as OrderReceipt;
  assert.equal(receipt.totalCents, 10422);
  assert.equal(receipt.status, 'pending_payment');
});

test('a retry returns the same saved order, even after its quote expires', async () => {
  const { checkout, saved, advance } = setup();
  const request = orderBody(await checkout(quoteBody) as CheckoutQuote);
  const first = await checkout(request);
  advance();
  assert.deepEqual(await checkout(request), first);
  assert.equal(saved.size, 1);
  await assert.rejects(checkout({ ...request, customer: { ...customer, fullName: 'Someone Else' } }), { code: 'ORDER_CONFLICT' });
});

test('tampered quote, changed address/quantity/price, and expired quote are rejected', async () => {
  const { checkout, changePrice, advance } = setup();
  const quote = await checkout(quoteBody) as CheckoutQuote;
  const request = orderBody(quote);
  const [payload, signature] = request.quoteToken.split('.');
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
  decoded.amountCents = 1;
  await assert.rejects(checkout({ ...request, quoteToken: `${Buffer.from(JSON.stringify(decoded)).toString('base64url')}.${signature}` }), { code: 'QUOTE_INVALID' });
  await assert.rejects(checkout({ ...request, customer: { ...customer, zip: '90210' } }), { code: 'QUOTE_CHANGED' });
  await assert.rejects(checkout({ ...request, items: [{ id: 'candle-1', quantity: 1 }] }), { code: 'QUOTE_CHANGED' });
  changePrice();
  await assert.rejects(checkout(request), { code: 'QUOTE_CHANGED' });
  advance();
  await assert.rejects(checkout(request), { code: 'QUOTE_EXPIRED' });
});

test('invalid, excessive, or duplicate quantities and invalid addresses cannot reach checkout', () => {
  for (const quantity of [-1, 0, 1.5, 25, '2', NaN]) assert.throws(() => parseCart([{ id: 'candle-1', quantity }]));
  assert.throws(() => parseCart([{ id: 'candle-1', quantity: 1 }, { id: 'candle-1', quantity: 1 }]));
  assert.throws(() => parseCart([{ id: 'candle-1', quantity: 20 }, { id: 'candle-2', quantity: 5 }]));
  assert.throws(() => parseCart([{ id: '../etc/passwd', quantity: 1 }]));
  for (const patch of [{ fullName: '  ' }, { zip: '6062' }, { state: 'ZZ' }, { country: 'CA' }, { email: 'bad' }]) assert.throws(() => parseCustomer({ ...customer, ...patch }));
  assert.equal(parseCustomer({ ...customer, email: '  Shopper@Example.com ', zip: '60622-1234' }).email, 'shopper@example.com');
});

test('checkout rejects quantities above live stock, including stock changes after quoting', async () => {
  const { checkout, saved, setStock } = setup();
  setStock(2);
  const quote = await checkout(quoteBody) as CheckoutQuote;
  await assert.rejects(checkout({ ...quoteBody, items: [{ id: 'candle-1', quantity: 3, stock: 999 }] }), { code: 'CART_CHANGED', status: 409 });
  setStock(1);
  await assert.rejects(checkout(orderBody(quote)), { code: 'CART_CHANGED', status: 409 });
  assert.equal(saved.size, 0);
  setStock(0);
  await assert.rejects(checkout(quoteBody), { code: 'CART_CHANGED', status: 409 });
});

test('retrying a saved order still succeeds after its candle sells out', async () => {
  const { checkout, setStock, saved } = setup();
  const request = orderBody(await checkout(quoteBody) as CheckoutQuote);
  const receipt = await checkout(request);
  setStock(0);
  assert.deepEqual(await checkout(request), receipt);
  assert.equal(saved.size, 1);
});

test('local order persistence is atomic, idempotent, and survives a new store instance', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'candles-orders-test-'));
  try {
    const store = localOrderStore(directory);
    const { checkout } = setup(store);
    const request = orderBody(await checkout(quoteBody) as CheckoutQuote);
    const [first, second] = await Promise.all([checkout(request), checkout(request)]);
    assert.deepEqual(first, second);
    assert.equal((await readdir(directory)).length, 1);
    assert.deepEqual((await localOrderStore(directory).find(request.idempotencyKey))?.receipt, first);
    await assert.rejects(store.find('../secret'));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
