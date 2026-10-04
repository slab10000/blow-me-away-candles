import { CheckoutError } from './errors.ts';

export type ServerEnv = Record<string, string | undefined>;
const LABELS: Record<string, string> = { USPS_GROUND_ADVANTAGE: 'USPS Ground Advantage', PRIORITY_MAIL: 'USPS Priority Mail' };
export interface Postage { service: string; label: string; unitAmountCents: number }

export function uspsBaseURL(env: ServerEnv) {
  const environment = env.USPS_ENVIRONMENT?.trim() || 'production';
  if (!['production', 'test'].includes(environment)) throw new CheckoutError('The shipping environment needs to be configured.', 503, 'USPS_CONFIG');
  return environment === 'test' ? 'https://apis-tem.usps.com' : 'https://apis.usps.com';
}

// Shared by checkout and the diagnostic command, so the check sends exactly the
// same package information as a customer quote. Credentials are never included.
export function uspsRateRequest(env: ServerEnv, zip: string) {
  const weight = Number(env.USPS_PACKAGE_WEIGHT_LB);
  const dimensions = [Number(env.USPS_PACKAGE_LENGTH_IN), Number(env.USPS_PACKAGE_WIDTH_IN), Number(env.USPS_PACKAGE_HEIGHT_IN)].sort((a, b) => b - a);
  const originZIPCode = env.USPS_ORIGIN_ZIP?.trim();
  if (!/^\d{5}$/.test(originZIPCode || '') || !(weight > 0 && weight <= 70) || dimensions.some(n => !Number.isFinite(n) || n <= 0) || dimensions[0] + 2 * (dimensions[1] + dimensions[2]) > 108) {
    throw new CheckoutError('Shipping package details need to be configured. Please contact us for help.', 503, 'SHIPPING_NOT_CONFIGURED');
  }
  if (typeof zip !== 'string' || !/^\d{5}(?:[-\s]\d{4})?$/.test(zip.trim())) throw new CheckoutError('Enter a 5-digit destination ZIP code or ZIP+4.', 400, 'INVALID_ZIP');
  return {
    originZIPCode,
    destinationZIPCode: zip.trim().slice(0, 5),
    weight, length: dimensions[0], width: dimensions[1], height: dimensions[2],
    mailClasses: Object.keys(LABELS),
    priceType: 'RETAIL',
    // The v3 specification recommends 920 (USPS Tracking) for these classes.
    // An omitted extraServices field asks for ALL available extra services.
    extraServices: [920],
  };
}

export function createUSPS(env: ServerEnv, fetcher: typeof fetch = fetch) {
  let accessToken = '';
  let tokenExpiresAt = 0;
  let tokenRequest: Promise<string> | undefined;
  const ratesCache = new Map<string, { expiresAt: number; rates: Postage[] }>();
  const inFlight = new Map<string, Promise<Postage[]>>();

  async function request(path: string, body: unknown, token?: string) {
    const baseURL = uspsBaseURL(env);
    const isOAuth = path === '/oauth2/v3/token';
    let response: Response;
    try {
      response = await fetcher(`${baseURL}${path}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
        redirect: 'error',
      });
    } catch {
      throw new CheckoutError('USPS could not be reached. Please try calculating shipping again.', 503, 'USPS_UNAVAILABLE');
    }
    if (!response.ok) {
      if (isOAuth && [400, 401, 403].includes(response.status)) {
        throw new CheckoutError('USPS shipping is not connected yet. Please contact us or try again later.', 503, 'USPS_AUTH');
      }
      if (response.status === 401) throw new CheckoutError('USPS shipping authorization expired. Please try again.', 503, 'USPS_TOKEN_EXPIRED');
      if (response.status === 403) throw new CheckoutError('USPS shipping access is not enabled yet. Please contact us or try again later.', 503, 'USPS_ACCESS_DENIED');
      if (response.status === 429) throw new CheckoutError('USPS is receiving too many requests. Please try again in a few minutes.', 503, 'USPS_BUSY');
      if (response.status === 400 || response.status === 422) throw new CheckoutError('USPS could not price this shipment. Check your ZIP code or contact us for help.', 422, 'USPS_RATE_REQUEST');
      if (response.status === 404) throw new CheckoutError('USPS could not find shipping for this destination. Check your ZIP code and try again.', 422, 'NO_RATES');
      throw new CheckoutError('USPS rates are temporarily unavailable. Please try again.', 503, 'USPS_UNAVAILABLE');
    }
    try { return await response.json(); }
    catch { throw new CheckoutError('USPS returned an unreadable response. Please try again.', 503, 'USPS_INVALID_RESPONSE'); }
  }

  async function getToken() {
    if (accessToken && Date.now() < tokenExpiresAt) return accessToken;
    const clientId = env.USPS_CLIENT_ID?.trim();
    const clientSecret = env.USPS_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) throw new CheckoutError('Shipping is not connected yet. Your cart is saved; please try again later or contact us.', 503, 'SHIPPING_NOT_CONFIGURED');
    if (!tokenRequest) tokenRequest = (async () => {
      // USPS names this OAuth permission "domestic-prices", even though the
      // pricing endpoint is under /prices/v3. "prices" returns invalid_scope.
      const result = await request('/oauth2/v3/token', { grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope: 'domestic-prices' });
      if (typeof result?.access_token !== 'string' || !result.access_token.trim() || !Number.isFinite(Number(result.expires_in)) || Number(result.expires_in) <= 0 || typeof result.token_type !== 'string' || result.token_type.toLowerCase() !== 'bearer' || result.status === 'revoked') throw new CheckoutError('USPS authentication is unavailable. Please try again later.', 503, 'USPS_INVALID_RESPONSE');
      if (typeof result.scope === 'string' && !result.scope.split(/\s+/).includes('domestic-prices')) throw new CheckoutError('USPS shipping access is not enabled yet. Please contact us or try again later.', 503, 'USPS_ACCESS_DENIED');
      accessToken = result.access_token;
      tokenExpiresAt = Date.now() + Math.max(0, Number(result.expires_in) - 60) * 1000;
      return accessToken;
    })().finally(() => { tokenRequest = undefined; });
    return tokenRequest;
  }

  async function getRates(zip: string): Promise<Postage[]> {
    const body = uspsRateRequest(env, zip);
    uspsBaseURL(env);
    // The configured weight is the gross weight of ONE boxed candle. Each candle
    // ships in its own box; the checkout service multiplies this rate by quantity.
    const key = JSON.stringify(body);
    const cached = ratesCache.get(key);
    if (cached && Date.now() < cached.expiresAt) return cached.rates;
    if (inFlight.has(key)) return inFlight.get(key)!;
    const promise = (async () => {
      const token = await getToken();
      let result;
      try { result = await request('/prices/v3/total-rates/search', body, token); }
      catch (error) {
        // Retry an expired/revoked bearer token once. Invalid credentials and
        // insufficient API permissions need account setup, not repeated requests.
        if (!(error instanceof CheckoutError) || error.code !== 'USPS_TOKEN_EXPIRED') throw error;
        if (accessToken === token) accessToken = '';
        result = await request('/prices/v3/total-rates/search', body, await getToken());
      }
      if (!Array.isArray(result?.rateOptions)) throw new CheckoutError('USPS returned an unreadable rate response. Please try again.', 503, 'USPS_INVALID_RESPONSE');
      const best = new Map<string, Postage>();
      for (const option of result.rateOptions) {
        const rate = option?.rates?.[0];
        // Exclude flat-rate packaging, presort, and destination-entry discounts.
        // SP is single-piece; DR is dimensional rectangular, both for our own box.
        if (!rate || !LABELS[rate.mailClass] || rate.priceType !== 'RETAIL' || rate.destinationEntryFacilityType !== 'NONE' || !['SP', 'DR'].includes(rate.rateIndicator) || !['MACHINABLE', 'NONSTANDARD'].includes(rate.processingCategory)) continue;
        const amount = option.totalPrice ?? option.totalBasePrice;
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) continue;
        const cents = Math.round(amount * 100);
        if (!Number.isSafeInteger(cents) || cents <= 0) continue;
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
