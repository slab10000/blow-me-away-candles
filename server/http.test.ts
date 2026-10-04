import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createCheckoutHandler } from './http.ts';

test('HTTP rejects cross-origin, wrong methods, oversized and malformed requests without leaking errors', async () => {
  const handler = createCheckoutHandler(async body => { if ((body as any)?.fail) throw new Error('secret-token'); return { ok: true }; });
  const call = async (body: string, headers: Record<string, string> = {}, method = 'POST') => {
    const req = Readable.from([Buffer.from(body)]) as IncomingMessage;
    req.method = method;
    req.headers = { host: 'localhost:3000', 'content-type': 'application/json', ...headers };
    Object.defineProperty(req, 'socket', { value: { remoteAddress: 'test' } });
    let output = '';
    const res = { statusCode: 200, setHeader() {}, end(value: string) { output = value; } };
    await handler(req, res as unknown as ServerResponse);
    return { status: res.statusCode, output };
  };
  assert.equal((await call('{}', {}, 'GET')).status, 405);
  assert.equal((await call('{}', { origin: 'https://other.example.com' })).status, 403);
  assert.equal((await call('{}', { 'content-type': 'text/plain' })).status, 415);
  assert.equal((await call('bad-json')).status, 400);
  assert.equal((await call('x'.repeat(32769))).status, 413);
  assert.equal((await call('{}', { origin: 'http://localhost:3000' })).status, 200);
  const failed = await call('{"fail":true}');
  assert.equal(failed.status, 500);
  assert.ok(!failed.output.includes('secret-token'));
});
