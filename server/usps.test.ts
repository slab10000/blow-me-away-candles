import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUSPS } from './usps.ts';

const env = { USPS_CLIENT_ID: 'test-client', USPS_CLIENT_SECRET: 'test-secret', USPS_ORIGIN_ZIP: '60622', USPS_PACKAGE_WEIGHT_LB: '4', USPS_PACKAGE_LENGTH_IN: '12', USPS_PACKAGE_WIDTH_IN: '12', USPS_PACKAGE_HEIGHT_IN: '12' };
const rate = (service: string, amount: number, overrides = {}) => ({ totalBasePrice: amount, rates: [{ mailClass: service, priceType: 'RETAIL', rateIndicator: 'SP', destinationEntryFacilityType: 'NONE', processingCategory: 'MACHINABLE', ...overrides }] });
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('USPS OAuth and rate payload follow v3; token/rate caches avoid repeated requests', async () => {
  const calls: { url: string; body: any; headers: any }[] = [];
  const api = createUSPS(env, (async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(String(init!.body)), headers: init!.headers });
    return String(url).includes('oauth2') ? response({ access_token: 'token', expires_in: '3600' }) : response({ rateOptions: [rate('USPS_GROUND_ADVANTAGE', 9.35), rate('PRIORITY_MAIL', 14.6)] });
  }) as typeof fetch);
  const [first, second] = await Promise.all([api.getRates('90210'), api.getRates('90210')]);
  assert.deepEqual(first, second);
  assert.equal(first[0].unitAmountCents, 935);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://apis.usps.com/oauth2/v3/token');
  assert.equal(calls[0].body.grant_type, 'client_credentials');
  assert.equal(calls[1].url, 'https://apis.usps.com/prices/v3/total-rates/search');
  assert.equal(calls[1].headers.Authorization, 'Bearer token');
  assert.deepEqual(calls[1].body, { originZIPCode: '60622', destinationZIPCode: '90210', weight: 4, length: 12, width: 12, height: 12, mailClasses: ['USPS_GROUND_ADVANTAGE', 'PRIORITY_MAIL'], priceType: 'RETAIL', extraServices: [] });
  await api.getRates('90210-1234');
  assert.equal(calls.length, 2);
  await api.getRates('60622');
  assert.equal(calls.length, 3);
});

test('only eligible own-box retail rates are selected, including total fees', async () => {
  const api = createUSPS(env, (async url => String(url).includes('oauth2') ? response({ access_token: 'token', expires_in: 3600 }) : response({ rateOptions: [
    rate('PRIORITY_MAIL', 1, { rateIndicator: 'FB' }),
    rate('USPS_GROUND_ADVANTAGE', 2, { destinationEntryFacilityType: 'DESTINATION_DELIVERY_UNIT' }),
    rate('USPS_GROUND_ADVANTAGE', 3, { priceType: 'COMMERCIAL' }),
    rate('USPS_GROUND_ADVANTAGE', 0),
    { ...rate('USPS_GROUND_ADVANTAGE', 9.15, { rateIndicator: 'DR' }), totalPrice: 10.25 },
    rate('PRIORITY_MAIL', 15.5),
  ] })) as typeof fetch);
  assert.deepEqual((await api.getRates('90210')).map(r => r.unitAmountCents), [1025, 1550]);
});

test('missing credentials, invalid packages, throttling and empty rates fail without a made-up price', async () => {
  let requests = 0;
  const never = (async () => { requests++; throw new Error('Must not request'); }) as typeof fetch;
  await assert.rejects(createUSPS({ ...env, USPS_CLIENT_SECRET: '' }, never).getRates('90210'), { code: 'SHIPPING_NOT_CONFIGURED' });
  await assert.rejects(createUSPS({ ...env, USPS_PACKAGE_WEIGHT_LB: '0' }, never).getRates('90210'), { code: 'SHIPPING_NOT_CONFIGURED' });
  assert.equal(requests, 0);
  await assert.rejects(createUSPS(env, (async () => response({}, 429)) as typeof fetch).getRates('90210'), { code: 'USPS_BUSY' });
  await assert.rejects(createUSPS(env, (async url => String(url).includes('oauth2') ? response({ access_token: 'token', expires_in: 3600 }) : response({ rateOptions: [] })) as typeof fetch).getRates('90210'), { code: 'NO_RATES' });
});

test('a revoked access token is refreshed once and sandbox requests use only the test host', async () => {
  let tokens = 0, rateRequests = 0;
  const api = createUSPS({ ...env, USPS_ENVIRONMENT: 'test' }, (async url => {
    assert.ok(String(url).startsWith('https://apis-tem.usps.com/'));
    if (String(url).includes('oauth2')) return response({ access_token: `token-${++tokens}`, expires_in: 3600 });
    return ++rateRequests === 1 ? response({}, 401) : response({ rateOptions: [rate('USPS_GROUND_ADVANTAGE', 8.5)] });
  }) as typeof fetch);
  assert.equal((await api.getRates('90210'))[0].unitAmountCents, 850);
  assert.equal(tokens, 2);
  assert.equal(rateRequests, 2);
});
