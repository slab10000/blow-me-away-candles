import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadEnv } from 'vite';
import { createUSPS, uspsBaseURL, uspsRateRequest } from '../server/usps.ts';
import { CheckoutError } from '../server/errors.ts';
import { MAX_ITEMS, money } from '../shared/commerce.ts';

const help = 'Usage: npm run usps:check -- <destination-ZIP> [--quantity 2] [--dry-run]';
const fixes: Record<string, string> = {
  SHIPPING_NOT_CONFIGURED: 'Check USPS_CLIENT_ID, USPS_CLIENT_SECRET, USPS_ORIGIN_ZIP, and the USPS_PACKAGE_* settings in .env.local. Get the Consumer Key and Consumer Secret from https://cop.usps.com → My Apps → your app → Credentials.',
  USPS_CONFIG: 'Set USPS_ENVIRONMENT to production or test in .env.local.',
  USPS_AUTH: 'USPS rejected the OAuth request. Verify the Consumer Key/Consumer Secret pair and that the app is enabled in the USPS Business Portal. Use app credentials, not your USPS login or an old Web Tools user ID.',
  USPS_ACCESS_DENIED: 'Check that the USPS app has Domestic Pricing access (OAuth scope: domestic-prices) and that COP onboarding is complete. If access is missing, contact https://emailus.usps.com/s/usps-APIs.',
  USPS_TOKEN_EXPIRED: 'USPS rejected the bearer token even after one refresh. Check app authorization in the Business Portal.',
  USPS_RATE_REQUEST: 'USPS rejected the shipment parameters. Re-run with --dry-run to inspect the exact request. Verify both ZIP codes, dimensions in inches, and weight in pounds.',
  USPS_BUSY: 'The USPS app quota is exhausted. Wait before retrying; check the app quota or request an increase from USPS API Support.',
  USPS_INVALID_RESPONSE: 'USPS returned a response that does not match its documented schema. No shipping amount was used.',
  USPS_UNAVAILABLE: 'Check the network connection and USPS service availability, then retry.',
  NO_RATES: 'USPS returned no eligible retail own-box rates for Ground Advantage or Priority Mail. Verify the destination and package settings.',
};

try {
  const { values, positionals } = parseArgs({ options: { quantity: { type: 'string', default: '1' }, 'dry-run': { type: 'boolean', default: false }, help: { type: 'boolean', default: false } }, allowPositionals: true });
  if (values.help) {
    console.log(help);
  } else {
    if (positionals.length !== 1) throw new Error(help);
    const quantity = Number(values.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEMS) throw new Error(`Quantity must be 1–${MAX_ITEMS}.`);
    const root = fileURLToPath(new URL('../', import.meta.url));
    const env = { ...process.env, ...loadEnv('development', root, '') };
    const baseURL = uspsBaseURL(env);
    const body = uspsRateRequest(env, positionals[0]);
    console.log(`USPS endpoint: ${baseURL}`);
    console.log(`From ${body.originZIPCode} to ${body.destinationZIPCode}: ${quantity} package(s), each ${body.weight} lb, ${body.length} × ${body.width} × ${body.height} inches.`);
    console.log('Price type: RETAIL. Each candle is a separate package. This check does not create orders or buy postage.');
    if (values['dry-run']) {
      console.log('Dry run: no USPS request sent. POST /prices/v3/total-rates/search');
      console.log(JSON.stringify(body, null, 2));
      const missing = ['USPS_CLIENT_ID', 'USPS_CLIENT_SECRET'].filter(key => !env[key]?.trim());
      console.log(missing.length ? `Live rates still need: ${missing.join(', ')}.` : 'Credential fields are present; authentication has not been tested.');
    } else {
      if (env.USPS_ENVIRONMENT === 'test') console.log('TEM TEST ENVIRONMENT: these results are for integration testing.');
      const rates = await createUSPS(env).getRates(positionals[0]);
      console.log('USPS authentication and Domestic Pricing request succeeded.');
      for (const rate of rates) console.log(`${rate.label}: ${money(rate.unitAmountCents)} per package; ${money(rate.unitAmountCents * quantity)} total shipping.`);
    }
  }
} catch (error) {
  // Never print raw USPS response bodies, HTTP headers, or credential values.
  if (error instanceof CheckoutError) console.error(`${error.code}: ${error.message}\n${fixes[error.code] || ''}`);
  else console.error(error instanceof Error ? error.message : 'The USPS check could not be completed.');
  process.exitCode = 1;
}
