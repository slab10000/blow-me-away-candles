import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { parseCart, parseCustomer } from '../shared/commerce.ts';
import { loadCandleImages } from '../shared/catalogImages.ts';
import type { CartItem, CheckoutQuote, Customer, OrderLine, OrderReceipt } from '../shared/commerce.ts';
import { CheckoutError } from './errors.ts';
import { createUSPS } from './usps.ts';
import type { Postage, ServerEnv } from './usps.ts';
import type { OrderStore } from './orderStore.ts';
import { buildOrderLines } from './catalog.ts';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
interface SignedRate { cartHash: string; customerHash: string; service: string; label: string; amountCents: number; packageCount: number; expires: number }
interface Dependencies {
  env: ServerEnv;
  store: OrderStore;
  catalog?: (items: CartItem[]) => Promise<OrderLine[]>;
  getRates?: (zip: string) => Promise<Postage[]>;
  now?: () => number;
}

export function createCheckout({ env, store, catalog, getRates, now = Date.now }: Dependencies) {
  if (env.VERCEL && (!env.CHECKOUT_SIGNING_SECRET || env.CHECKOUT_SIGNING_SECRET.length < 32)) throw new CheckoutError('Checkout is not configured yet.', 503, 'CHECKOUT_NOT_CONFIGURED');
  const secret = env.CHECKOUT_SIGNING_SECRET || randomBytes(32).toString('hex');
  const rates = getRates || createUSPS(env).getRates;
  const sign = (payload: string) => createHmac('sha256', secret).update(payload).digest('base64url');
  const signRate = (rate: SignedRate) => {
    const payload = Buffer.from(JSON.stringify(rate)).toString('base64url');
    return `${payload}.${sign(payload)}`;
  };
  const readRate = (token: unknown): SignedRate => {
    try {
      if (typeof token !== 'string' || token.length > 4000) throw new Error();
      const [payload, signature, extra] = token.split('.');
      const expected = sign(payload);
      if (extra || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error();
      return JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch { throw new CheckoutError('Please calculate shipping again before saving your order.', 409, 'QUOTE_INVALID'); }
  };

  const loadCatalog = catalog || (async (items: CartItem[]): Promise<OrderLine[]> => {
    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw new CheckoutError('The collection is temporarily unavailable. Please try again.', 503, 'CATALOG_UNAVAILABLE');
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.from('candles').select('id,name,image,price,stock').in('id', items.map(item => item.id)).abortSignal(AbortSignal.timeout(10000));
    if (error) throw new CheckoutError('The collection is temporarily unavailable. Please try again.', 503, 'CATALOG_UNAVAILABLE');
    const candles = await loadCandleImages(db, data || []);
    return buildOrderLines(items, candles);
  });
  // Only price and quantity affect the cart signature; descriptive edits do not.
  const cartHash = (lines: OrderLine[]) => digest(lines.map(({ id, quantity, unitPriceCents }) => ({ id, quantity, unitPriceCents })));

  return async function checkout(input: unknown): Promise<CheckoutQuote | OrderReceipt> {
    if (!input || typeof input !== 'object') throw new CheckoutError('Invalid checkout request.');
    const body = input as Record<string, unknown>;
    if (!['quote', 'order'].includes(String(body.action))) throw new CheckoutError('Unknown checkout action.');
    let items: CartItem[], customer: Customer;
    try { items = parseCart(body.items); customer = parseCustomer(body.customer); }
    catch (error) { throw new CheckoutError((error as Error).message); }

    const fingerprint = digest({ items, customer, quoteToken: body.quoteToken });
    let id: string | undefined;
    if (body.action === 'order') {
      if (typeof body.idempotencyKey !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.idempotencyKey)) throw new CheckoutError('Invalid order reference. Please refresh checkout.');
      id = body.idempotencyKey;
      const previous = await store.find(id);
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new CheckoutError('This order reference has already been used. Please start a new checkout.', 409, 'ORDER_CONFLICT');
        return previous.receipt;
      }
    }
    const lines = await loadCatalog(items);
    const subtotalCents = lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
    if (body.action === 'quote') {
      const postage = await rates(customer.zip);
      const packageCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const expires = now() + 15 * 60 * 1000;
      return {
        items: lines,
        subtotalCents,
        expiresAt: new Date(expires).toISOString(),
        options: postage.map(rate => {
          const amountCents = rate.unitAmountCents * packageCount;
          return { service: rate.service, label: rate.label, amountCents, packageCount, token: signRate({ cartHash: cartHash(lines), customerHash: digest(customer), service: rate.service, label: rate.label, amountCents, packageCount, expires }) };
        }),
      };
    }
    const rate = readRate(body.quoteToken);
    if (rate.expires <= now()) throw new CheckoutError('Your shipping quote has expired. Please calculate shipping again.', 409, 'QUOTE_EXPIRED');
    if (rate.cartHash !== cartHash(lines) || rate.customerHash !== digest(customer)) throw new CheckoutError('Your cart, prices, or delivery details changed. Please calculate shipping again.', 409, 'QUOTE_CHANGED');
    const receipt: OrderReceipt = {
      id: id!, number: `BMA-${id!.replaceAll('-', '').slice(0, 12).toUpperCase()}`, status: 'pending_payment', createdAt: new Date(now()).toISOString(),
      items: lines, subtotalCents, shippingCents: rate.amountCents, shippingLabel: rate.label, totalCents: subtotalCents + rate.amountCents,
    };
    const saved = await store.save(id!, { fingerprint, customer, receipt });
    if (saved.fingerprint !== fingerprint) throw new CheckoutError('This order reference has already been used.', 409, 'ORDER_CONFLICT');
    return saved.receipt;
  };
}
