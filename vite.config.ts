import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { checkoutPlugin } from './server/viteCheckout';

export default defineConfig(({ mode }) => ({
  worker: { format: 'es' },
  server: {
    port: 3000,
    host: '0.0.0.0',
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.local-orders/**'] },
  },
  plugins: [react(), checkoutPlugin({ ...process.env, ...loadEnv(mode, process.cwd(), '') })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
