export class CheckoutRequestError extends Error {
  code: string;
  constructor(message: string, code = 'NETWORK_ERROR') { super(message); this.code = code; }
}

export async function checkoutRequest<T>(body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    });
  } catch { throw new CheckoutRequestError('We could not reach checkout. Check your connection and try again; your cart is still here.'); }
  let result;
  try { result = await response.json(); }
  catch { throw new CheckoutRequestError('Checkout could not be reached. Please try again shortly.'); }
  if (!response.ok) throw new CheckoutRequestError(result.error || 'Checkout is temporarily unavailable.', result.code);
  return result as T;
}
