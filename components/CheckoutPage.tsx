import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Loader2, MapPin, Package, Truck } from 'lucide-react';
import { useCart } from '../lib/CartContext';
import { CheckoutRequestError, checkoutRequest } from '../lib/checkoutClient';
import { money, parseCustomer, US_STATES } from '../shared/commerce';
import type { CheckoutQuote, Customer, OrderReceipt } from '../shared/commerce';
import ShopLayout, { shopButton } from './ShopLayout';
import { availableStock } from '../shared/inventory';

const DRAFT_KEY = 'blow-me-away.checkout.v1';
export const RECEIPT_KEY = 'blow-me-away.receipt.v1';
const emptyCustomer: Customer = { fullName: '', email: '', address1: '', address2: '', city: '', state: '', zip: '', country: 'US' };
type Quoted = { quote: CheckoutQuote; forInput: string; selected: string; idempotencyKey: string };
type Draft = { customer: Customer; quoted: Quoted | null };

function readDraft(): Draft {
  try {
    const data = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    if (!data?.customer || !Object.keys(emptyCustomer).every(key => typeof data.customer[key] === 'string' && data.customer[key].length <= 254)) throw new Error();
    const q = data.quoted;
    const validQuote = q && typeof q.forInput === 'string' && typeof q.selected === 'string' && typeof q.idempotencyKey === 'string' && Number.isFinite(q.quote?.subtotalCents) && Array.isArray(q.quote?.items) && q.quote.items.every(item => typeof item.name === 'string' && Number.isInteger(item.quantity) && Number.isInteger(item.unitPriceCents)) && Array.isArray(q.quote?.options) && q.quote.options.every(option => typeof option.token === 'string' && typeof option.service === 'string' && Number.isInteger(option.amountCents)) && Number.isFinite(Date.parse(q.quote.expiresAt));
    return { customer: data.customer, quoted: validQuote ? q : null };
  } catch { return { customer: { ...emptyCustomer }, quoted: null }; }
}

const CheckoutPage: React.FC = () => {
  const { items, candles, count, subtotalCents, loading, catalogError, consume } = useCart();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(readDraft);
  const [busy, setBusy] = useState<'quote' | 'order' | null>(null);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const submitting = useRef(false);
  const { customer, quoted } = draft;
  const inputKey = JSON.stringify({ items: [...items].sort((a, b) => a.id.localeCompare(b.id)), customer });
  const latestInput = useRef(inputKey);
  latestInput.current = inputKey;
  const expired = Boolean(quoted && Date.parse(quoted.quote.expiresAt) <= clock);
  const active = quoted && quoted.forInput === inputKey && !expired ? quoted : null;
  const selected = active?.quote.options.find(option => option.service === active.selected);
  const unavailable = items.some(item => item.quantity > availableStock(candles.find(c => c.id === item.id)));
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }
    catch { setStorageError(true); }
  }, [draft]);
  useEffect(() => {
    if (!quoted) return;
    const timer = window.setTimeout(() => setClock(Date.now()), Math.max(0, Date.parse(quoted.quote.expiresAt) - Date.now()) + 50);
    return () => window.clearTimeout(timer);
  }, [quoted]);
  useEffect(() => { if (active) heading.current?.focus(); }, [Boolean(active)]);

  const updateField = (key: keyof Customer, value: string) => {
    setDraft(current => ({ customer: { ...current.customer, [key]: value }, quoted: null }));
    setError('');
  };
  const calculateShipping = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    let normalized: Customer;
    try { normalized = parseCustomer(customer); }
    catch (err) { setError((err as Error).message); return; }
    submitting.current = true;
    setBusy('quote'); setError('');
    const requestedFor = inputKey;
    try {
      const quote = await checkoutRequest<CheckoutQuote>({ action: 'quote', items, customer: normalized });
      if (latestInput.current !== requestedFor) return;
      if (!quote.options?.length) throw new Error('No shipping options were returned. Please try again.');
      setClock(Date.now());
      // Retain the exact form values in forInput; the server normalizes independently.
      setDraft(current => ({ ...current, quoted: { quote, forInput: requestedFor, selected: quote.options[0].service, idempotencyKey: crypto.randomUUID() } }));
    } catch (err) { if (latestInput.current === requestedFor) setError((err as Error).message); }
    finally { submitting.current = false; setBusy(null); }
  };
  const saveOrder = async () => {
    if (!active || !selected || submitting.current) return;
    submitting.current = true;
    setBusy('order'); setError('');
    try {
      const receipt = await checkoutRequest<OrderReceipt>({ action: 'order', items, customer, quoteToken: selected.token, idempotencyKey: active.idempotencyKey });
      // Persist the receipt before clearing the cart. Retry uses the same reference
      // if the response was lost, including after a refresh in this tab.
      try { sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt)); sessionStorage.removeItem(DRAFT_KEY); } catch { /* Navigation state retains the receipt for this visit. */ }
      consume(receipt.items);
      navigate('/order-confirmation', { state: receipt, replace: true });
    } catch (err) {
      setError((err as Error).message);
      if (err instanceof CheckoutRequestError && ['QUOTE_EXPIRED', 'QUOTE_CHANGED', 'QUOTE_INVALID', 'CART_CHANGED', 'ORDER_CONFLICT'].includes(err.code)) setDraft(current => ({ ...current, quoted: null }));
    } finally { submitting.current = false; setBusy(null); }
  };

  const inputClass = 'mt-2 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-base text-gray-900 outline-none focus:ring-2 focus:ring-[#829cc1] focus:border-[#829cc1] disabled:bg-gray-50';
  const field = (key: keyof Customer, label: string, autoComplete: string, options: { optional?: boolean; type?: string; max?: number; pattern?: string } = {}) => <label className="block text-sm font-semibold">
    {label}{options.optional && <span className="font-normal text-gray-400"> (optional)</span>}
    <input name={key} value={customer[key]} onChange={event => updateField(key, event.target.value)} autoComplete={autoComplete} required={!options.optional} type={options.type || 'text'} maxLength={options.max || 100} pattern={options.pattern} className={inputClass} />
  </label>;

  return <ShopLayout step={active ? 3 : 2} title={active ? 'One last look.' : 'Where should the glow go?'} subtitle={active ? 'Review your candles, delivery details, and shipping before saving your order.' : 'Tell us where to send your candles. We’ll find your USPS shipping options.'}>
    {!items.length ? <div className="rounded-2xl bg-white border border-gray-200 p-10 text-center"><p className="font-serif text-2xl mb-6">Your cart is empty.</p><Link to="/" className={shopButton}>Explore the collection</Link></div>
      : loading ? <p role="status">Loading checkout…</p>
      : catalogError || unavailable ? <div role="alert" className="bg-amber-50 border border-amber-200 p-6 rounded-xl"><p>{catalogError || 'A candle in your cart is no longer available.'}</p><Link to="/cart" className="underline mt-3 inline-block">Return to your cart</Link></div>
      : <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8">
            <div className="flex justify-between items-center mb-7 gap-4">
              <h2 ref={heading} tabIndex={-1} className="font-serif text-2xl outline-none">{active ? 'Delivery details' : 'Your details'}</h2>
              {active && <button onClick={() => { setDraft(current => ({ ...current, quoted: null })); setError(''); }} disabled={!!busy} className="text-sm underline underline-offset-4 text-gray-500">Edit</button>}
            </div>
            {active ? <div className="flex gap-3 text-sm leading-7 text-gray-600"><MapPin size={20} className="mt-1 shrink-0 text-[#829cc1]" /><div><p className="font-semibold text-gray-900">{customer.fullName}</p><p>{customer.address1}</p>{customer.address2 && <p>{customer.address2}</p>}<p>{customer.city}, {customer.state} {customer.zip}</p><p>United States</p><p className="mt-3 break-all">{customer.email}</p></div></div>
              : <form onSubmit={calculateShipping}>
                <fieldset disabled={!!busy} className="space-y-5">
                  {field('fullName', 'Full name', 'shipping name')}
                  {field('email', 'Email address', 'email', { type: 'email', max: 254 })}
                  <div className="border-t border-gray-100 pt-6"><h3 className="text-xs uppercase tracking-widest text-gray-500 mb-5">Shipping address</h3>{field('address1', 'Street address', 'shipping address-line1')}</div>
                  {field('address2', 'Apartment, suite, etc.', 'shipping address-line2', { optional: true })}
                  {field('city', 'City', 'shipping address-level2', { max: 60 })}
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm font-semibold">State<select name="state" value={customer.state} onChange={event => updateField('state', event.target.value)} required autoComplete="shipping address-level1" className={inputClass}><option value="">Select state</option>{US_STATES.map(state => <option key={state} value={state}>{state}</option>)}</select></label>
                    {field('zip', 'ZIP code', 'shipping postal-code', { max: 10, pattern: '[0-9]{5}(-[0-9]{4})?' })}
                  </div>
                  <div className="text-sm text-gray-500 flex justify-between border-b border-gray-100 pb-5"><span>Country</span><span className="text-gray-900">United States</span></div>
                  <p className="text-xs leading-relaxed text-gray-500">Currently shipping to the 50 U.S. states and Washington, DC. Please double-check your street address.</p>
                  <button type="submit" className={`${shopButton} w-full`} disabled={!!busy}>{busy === 'quote' ? <><Loader2 size={16} className="animate-spin" />Getting USPS rates…</> : <>Calculate shipping <ArrowRight size={16} /></>}</button>
                </fieldset>
              </form>}
          </section>
          {active && <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8">
            <h2 className="font-serif text-2xl mb-2">The journey to your door</h2>
            <p className="text-sm text-gray-500 mb-6">USPS rates for your delivery ZIP code.</p>
            <fieldset disabled={!!busy} className="space-y-3"><legend className="sr-only">Shipping service</legend>
              {active.quote.options.map(option => <label key={option.service} className={`flex items-center gap-3 cursor-pointer rounded-xl border p-4 transition-colors ${option.service === selected?.service ? 'border-[#829cc1] bg-[#f1f4f8]' : 'border-gray-200 hover:border-gray-400'}`}>
                <input type="radio" name="shipping" value={option.service} checked={option.service === selected?.service} onChange={() => setDraft(current => ({ ...current, quoted: { ...active, selected: option.service, idempotencyKey: crypto.randomUUID() } }))} className="accent-[#566f93]" />
                <span className="flex-1 text-sm font-semibold">{option.label}</span><span className="text-sm font-semibold">{money(option.amountCents)}</span>
              </label>)}
            </fieldset>
            <p className="flex gap-2 text-xs leading-relaxed text-gray-500 mt-5"><Package size={16} className="shrink-0" />{selected?.packageCount} {selected?.packageCount === 1 ? 'package' : 'packages'} · Each candle ships in its own box. Quotes are valid for 15 minutes.</p>
          </section>}
          {(error || expired) && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 leading-relaxed">{error || 'Your shipping quote has expired. Please calculate shipping again.'}<a href="/#contact" className="underline underline-offset-4 ml-1">Contact us</a></div>}
          {storageError && <p role="status" className="text-xs text-amber-800">This browser could not save your checkout progress. Keep this tab open until you finish.</p>}
          <p className="flex items-center gap-2 text-xs text-gray-500 px-1"><Check size={14} />No payment is collected at this step.</p>
        </div>
        <aside className="rounded-2xl bg-[#edf1f6] p-6 sm:p-8 lg:sticky lg:top-28">
          <div className="flex justify-between items-center mb-6"><h2 className="font-serif text-2xl">Your order</h2><Link to="/cart" className="text-xs text-gray-500 underline underline-offset-4">Edit cart</Link></div>
          <ul className="space-y-5 mb-6">
            {(active?.quote.items || items.map(item => { const candle = candles.find(c => c.id === item.id)!; return { ...item, name: candle.name, image: candle.image, unitPriceCents: Math.round(candle.price * 100) }; })).map(item => <li key={item.id} className="flex gap-3 items-center">
              <img src={item.image} alt="" className="w-12 h-14 rounded object-cover bg-white" /><div className="flex-1 min-w-0"><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-gray-500 mt-1">Qty {item.quantity}</p></div><span className="text-sm whitespace-nowrap">{money(item.unitPriceCents * item.quantity)}</span>
            </li>)}
          </ul>
          <dl className="border-t border-gray-300/60 pt-5 text-sm space-y-4">
            <div className="flex justify-between"><dt>Subtotal ({count})</dt><dd>{money(active?.quote.subtotalCents ?? subtotalCents)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="flex items-center gap-2"><Truck size={14} />Shipping</dt><dd>{selected ? money(selected.amountCents) : 'Not calculated yet'}</dd></div>
            <div className="border-t border-gray-300/60 pt-5 flex justify-between items-center"><dt className="font-semibold">Estimated total</dt><dd className="text-2xl font-serif">{money((active?.quote.subtotalCents ?? subtotalCents) + (selected?.amountCents || 0))}</dd></div>
          </dl>
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">{selected ? 'Includes items and USPS shipping. Taxes are not calculated yet.' : 'Shipping will be added after you enter your address. Taxes are not calculated yet.'}</p>
          {active && <><button onClick={saveOrder} disabled={!!busy || !selected} className={`${shopButton} w-full mt-6`}>{busy === 'order' ? <><Loader2 size={16} className="animate-spin" />Saving your order…</> : <>Save order <ArrowRight size={16} /></>}</button><p className="mt-4 text-xs text-center leading-relaxed text-gray-500">Your order will be saved with payment pending. Nothing is charged or shipped yet.</p></>}
        </aside>
      </div>}
  </ShopLayout>;
};
export default CheckoutPage;
