import type { IncomingMessage, ServerResponse } from 'node:http';
import { createCheckout } from '../server/checkout.ts';
import { createCheckoutHandler } from '../server/http.ts';
import { supabaseOrderStore } from '../server/orderStore.ts';

let handler: ReturnType<typeof createCheckoutHandler>;
export default async function checkout(req: IncomingMessage, res: ServerResponse) {
  // Local Vite uses private files. Serverless deployments require durable storage.
  if (!handler) {
    try { handler = createCheckoutHandler(createCheckout({ env: process.env, store: supabaseOrderStore(process.env) })); }
    catch {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ error: 'Checkout is not configured yet. Please try again later.', code: 'CHECKOUT_NOT_CONFIGURED' }));
      return;
    }
  }
  await handler(req, res);
}
