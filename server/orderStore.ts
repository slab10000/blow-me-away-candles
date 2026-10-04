import { mkdir, readFile, writeFile, link, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { Customer, OrderReceipt } from '../shared/commerce.ts';
import type { ServerEnv } from './usps.ts';
import { CheckoutError } from './errors.ts';

export interface SavedOrder { fingerprint: string; customer: Customer; receipt: OrderReceipt }
export interface OrderStore {
  find(id: string): Promise<SavedOrder | null>;
  save(id: string, order: SavedOrder): Promise<SavedOrder>;
}

export function localOrderStore(directory: string): OrderStore {
  const filename = (id: string) => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new CheckoutError('Invalid order reference.');
    return path.join(directory, `${id}.json`);
  };
  const find = async (id: string) => {
    try { return JSON.parse(await readFile(filename(id), 'utf8')) as SavedOrder; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
  };
  return {
    find,
    async save(id, order) {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const temporary = path.join(directory, `.${randomUUID()}.tmp`);
      await writeFile(temporary, JSON.stringify(order, null, 2), { mode: 0o600, flag: 'wx' });
      try {
        // Atomic create-if-absent: even simultaneous retries create just one order.
        await link(temporary, filename(id));
        return order;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        return (await find(id))!;
      } finally { await unlink(temporary); }
    },
  };
}

export function supabaseOrderStore(env: ServerEnv): OrderStore {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!url || !env.SUPABASE_SERVICE_ROLE_KEY) throw new CheckoutError('Order saving is not configured yet. Please try again later.', 503, 'ORDERS_NOT_CONFIGURED');
  const db = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const find = async (id: string) => {
    const { data, error } = await db.from('checkout_orders').select('payload').eq('id', id).maybeSingle();
    if (error) throw new CheckoutError('Your order could not be saved. Please try again.', 503, 'ORDER_STORAGE');
    return (data?.payload as SavedOrder) ?? null;
  };
  return {
    find,
    async save(id, order) {
      const { error } = await db.from('checkout_orders').insert({ id, payload: order });
      if (error?.code === '23505') return (await find(id))!;
      if (error) throw new CheckoutError('Your order could not be saved. Please try again.', 503, 'ORDER_STORAGE');
      return order;
    },
  };
}
