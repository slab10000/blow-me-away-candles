import path from 'node:path';
import type { Plugin } from 'vite';
import { createCheckout } from './checkout.ts';
import { createCheckoutHandler } from './http.ts';
import { localOrderStore } from './orderStore.ts';
import type { ServerEnv } from './usps.ts';

export function checkoutPlugin(env: ServerEnv): Plugin {
  const handler = createCheckoutHandler(createCheckout({ env, store: localOrderStore(path.resolve('.local-orders')) }));
  const configure = (server: { middlewares: { use: Function } }) => {
    server.middlewares.use((req, res, next) => {
      let pathname: string;
      try { pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname); }
      catch { res.statusCode = 400; res.end(); return; }
      if (pathname.includes('.local-orders')) { res.statusCode = 404; res.end(); return; }
      if (pathname === '/api/checkout') { void handler(req, res); return; }
      next();
    });
  };
  return { name: 'local-checkout-api', configureServer: configure, configurePreviewServer: configure };
}
