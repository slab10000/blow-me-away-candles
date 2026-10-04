import { CheckoutError } from './errors.ts';

export type ServerEnv = Record<string, string | undefined>;
const LABELS: Record<string, string> = { USPS_GROUND_ADVANTAGE: 'USPS Ground Advantage', PRIORITY_MAIL: 'USPS Priority Mail' };
export interface Postage { service: string; label: string; unitAmountCents: number }

export function createUSPS(env: ServerEnv, fetcher: typeof fetch = fetch) {
  let accessToken = '';
  let tokenExpiresAt = 0;
  let tokenRequest: Promise<string> | undefined;
  const ratesCache = new Map<string, { expiresAt: number; rates: Postage[] }>();
  const inFlight = new Map<string, Promise<Postage[]>>();
  const baseURL = env.USPS_ENVIRONMENT === 'test' ? 'https://apis-tem.usps.com' : 'https://apis.usps.com';

  async function request(path: string, body: unknown, token?: string) {
    let response: Response;
    try {
      response = await fetcher(`${baseURL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      });
    } catch {
      throw new CheckoutError('USPS could not be reached. Please try calculating shipping again.', 503, 'USPS_UNAVAILABLE');
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        accessToken = '';
        throw new CheckoutError('USPS shipping is not connected yet. Please contact us or try again later.', 503, 'USPS_AUTH');
      }
      if (response.status === 429) throw new CheckoutError('USPS is receiving too many requests. Please try again in a few minutes.', 503, 'USPS_BUSY');
      if (response.status === 400 || response.status === 404 || response.status === 422) throw new CheckoutError('USPS could not find shipping for this destination. Check your ZIP code and try again.', 422, 'NO_RATES');
      throw new CheckoutError('USPS rates are temporarily unavailable. Please try again.', 503, 'USPS_UNAVAILABLE');
    }
    try { return await response.json(); }
    catch { throw new CheckoutError('USPS returned an unreadable response. Please try again.', 503, 'USPS_UNAVAILABLE'); }
  }

  async function getToken() {
    if (accessToken && Date.now() < tokenExpiresAt) return accessToken;
    if (!env.USPS_CLIENT_ID || !env.USPS_CLIENT_SECRET) throw new CheckoutError('Shipping is not connected yet. Your cart is saved; please try again later or contact us.', 503, 'SHIPPING_NOT_CONFIGURED');
    if (!tokenRequest) tokenRequest = (async () => {
      const result = await request('/oauth2/v3/token', { grant_type: 'client_credentials', client_id: env.USPS_CLIENT_ID, client_secret: env.USPS_CLIENT_SECRET });
      if (!result.access_token || !Number.isFinite(Number(result.expires_in))) throw new CheckoutError('USPS authentication is unavailable. Please try again later.', 503, 'USPS_AUTH');
      accessToken = result.access_token;
      tokenExpiresAt = Date.now() + Math.max(0, Number(result.expires_in) - 60) * 1000;
      return accessToken;
    })().finally(() => { tokenRequest = undefined; });
    return tokenRequest;
  }

  async function getRates(zip: string): Promise<Postage[]> {
    const weight = Number(env.USPS_PACKAGE_WEIGHT_LB);
    const dimensions = [Number(env.USPS_PACKAGE_LENGTH_IN), Number(env.USPS_PACKAGE_WIDTH_IN), Number(env.USPS_PACKAGE_HEIGHT_IN)].sort((a, b) => b - a);
    if (!/^\d{5}$/.test(env.USPS_ORIGIN_ZIP || '') || !(weight > 0 && weight <= 70) || dimensions.some(n => !Number.isFinite(n) || n <= 0) || dimensions[0] + 2 * (dimensions[1] + dimensions[2]) > 108) {
      throw new CheckoutError('Shipping package details need to be configured. Please contact us for help.', 503, 'SHIPPING_NOT_CONFIGURED');
    }
    // The configured weight is the gross weight of ONE boxed candle. Each candle
    // ships in its own box; the checkout service multiplies this rate by quantity.
    const key = zip.slice(0, 5);
    const cached = ratesCache.get(key);
    if (cached && Date.now() < cached.expiresAt) return cached.rates;
    if (inFlight.has(key)) return inFlight.get(key)!;
    const promise = (async () => {
      const body = {
        originZIPCode: env.USPS_ORIGIN_ZIP,
        destinationZIPCode: key,
        weight, length: dimensions[0], width: dimensions[1], height: dimensions[2],
        mailClasses: Object.keys(LABELS),
        priceType: 'RETAIL',
        extraServices: [],
      };
      let result;
      try { result = await request('/prices/v3/total-rates/search', body, await getToken()); }
      catch (error) {
        // A cached token may be revoked before its advertised expiry.
        if (!(error instanceof CheckoutError) || error.code !== 'USPS_AUTH') throw error;
        result = await request('/prices/v3/total-rates/search', body, await getToken());
      }
      const best = new Map<string, Postage>();
      for (const option of result.rateOptions ?? []) {
        const rate = option.rates?.[0];
        // Exclude flat-rate packaging, presort, and destination-entry discounts.
        // SP is single-piece; DR is dimensional rectangular, both for our own box.
        if (!rate || !LABELS[rate.mailClass] || rate.priceType !== 'RETAIL' || rate.destinationEntryFacilityType !== 'NONE' || !['SP', 'DR'].includes(rate.rateIndicator) || !['MACHINABLE', 'NONSTANDARD'].includes(rate.processingCategory)) continue;
        const amount = option.totalPrice ?? option.totalBasePrice;
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) continue;
        const cents = Math.round(amount * 100);
        if (!best.has(rate.mailClass) || cents < best.get(rate.mailClass)!.unitAmountCents) best.set(rate.mailClass, { service: rate.mailClass, label: LABELS[rate.mailClass], unitAmountCents: cents });
      }
      const rates = [...best.values()].sort((a, b) => a.unitAmountCents - b.unitAmountCents);
      if (!rates.length) throw new CheckoutError('USPS has no available shipping options for this package and ZIP code. Please check your address or contact us.', 422, 'NO_RATES');
      if (ratesCache.size >= 200) ratesCache.delete(ratesCache.keys().next().value!);
      ratesCache.set(key, { rates, expiresAt: Date.now() + 5 * 60 * 1000 });
      return rates;
    })().finally(() => { inFlight.delete(key); });
    inFlight.set(key, promise);
    return promise;
  }
  return { getRates };
}
