export const MAX_ITEMS = 24;
export const CART_KEY = 'blow-me-away.cart.v1';
export const US_STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');

export interface CartItem { id: string; quantity: number }
export interface Customer {
  fullName: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: 'US';
}
export interface OrderLine extends CartItem { name: string; image: string; unitPriceCents: number }
export interface ShippingOption {
  service: string;
  label: string;
  amountCents: number;
  packageCount: number;
  token: string;
}
export interface CheckoutQuote {
  items: OrderLine[];
  subtotalCents: number;
  options: ShippingOption[];
  expiresAt: string;
}
export interface OrderReceipt {
  id: string;
  number: string;
  status: 'pending_payment';
  createdAt: string;
  items: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  shippingLabel: string;
  totalCents: number;
}

export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export function parseCart(value: unknown): CartItem[] {
  if (!Array.isArray(value) || !value.length || value.length > MAX_ITEMS) throw new Error('Add at least one candle to your cart.');
  const seen = new Set<string>();
  let count = 0;
  const items = value.map(item => {
    if (!item || typeof item.id !== 'string' || !/^[\w-]{1,100}$/.test(item.id) || seen.has(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_ITEMS) {
      throw new Error('Your cart contains an invalid item. Please update your cart.');
    }
    seen.add(item.id);
    count += item.quantity;
    return { id: item.id, quantity: item.quantity };
  });
  if (count > MAX_ITEMS) throw new Error(`Please limit each order to ${MAX_ITEMS} candles.`);
  return items.sort((a, b) => a.id.localeCompare(b.id));
}

export function parseCustomer(value: unknown): Customer {
  if (!value || typeof value !== 'object') throw new Error('Please enter your delivery details.');
  const input = value as Record<string, unknown>;
  const field = (key: string, label: string, max: number, required = true) => {
    const text = typeof input[key] === 'string' ? input[key].trim().replace(/\s+/g, ' ') : '';
    if ((required && !text) || text.length > max || /[\x00-\x1f\x7f]/.test(text)) throw new Error(`Please enter a valid ${label}.`);
    return text;
  };
  const customer: Customer = {
    fullName: field('fullName', 'full name', 100),
    email: field('email', 'email address', 254).toLowerCase(),
    address1: field('address1', 'street address', 100),
    address2: field('address2', 'apartment or suite', 100, false),
    city: field('city', 'city', 60),
    state: field('state', 'state', 2).toUpperCase(),
    zip: field('zip', 'ZIP code', 10),
    country: 'US',
  };
  if (input.country !== 'US' || !US_STATES.includes(customer.state)) throw new Error('Shipping is currently available to the 50 U.S. states and Washington, DC.');
  if (!/^\d{5}(-\d{4})?$/.test(customer.zip)) throw new Error('Enter a 5-digit ZIP code or ZIP+4.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new Error('Please enter a valid email address.');
  return customer;
}
