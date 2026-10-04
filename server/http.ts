import type { IncomingMessage, ServerResponse } from 'node:http';
import { CheckoutError } from './errors.ts';

export function createCheckoutHandler(checkout: (body: unknown) => Promise<unknown>) {
  const clients = new Map<string, { requests: number; reset: number }>();
  return async (req: IncomingMessage & { body?: unknown }, res: ServerResponse) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); throw new CheckoutError('Method not allowed.', 405); }
      if (!req.headers['content-type']?.startsWith('application/json')) throw new CheckoutError('Expected a JSON request.', 415);
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw new CheckoutError('Request origin is not allowed.', 403);
      const ip = req.socket.remoteAddress || 'unknown';
      const current = clients.get(ip);
      const usage = current && current.reset > Date.now() ? current : { requests: 0, reset: Date.now() + 60000 };
      if (++usage.requests > 30) { res.setHeader('Retry-After', '60'); throw new CheckoutError('Please wait a minute before trying again.', 429); }
      if (clients.size > 1000) clients.clear();
      clients.set(ip, usage);
      let body = req.body;
      if (body === undefined) {
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of req) {
          const buffer = Buffer.from(chunk);
          size += buffer.length;
          if (size > 32768) throw new CheckoutError('Request is too large.', 413);
          chunks.push(buffer);
        }
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new CheckoutError('Invalid JSON request.'); }
      } else if (Buffer.byteLength(JSON.stringify(body)) > 32768) throw new CheckoutError('Request is too large.', 413);
      const result = await checkout(body);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (error) {
      const known = error instanceof CheckoutError;
      res.statusCode = known ? error.status : 500;
      res.end(JSON.stringify({ error: known ? error.message : 'Checkout is temporarily unavailable. Your cart is saved; please try again.', code: known ? error.code : 'CHECKOUT_UNAVAILABLE' }));
    }
  };
}
