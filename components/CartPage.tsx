import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useCart } from '../lib/CartContext';
import { MAX_ITEMS, money } from '../shared/commerce';
import ShopLayout, { shopButton } from './ShopLayout';
import { availableStock, quantityLimit } from '../shared/inventory';
import QuantitySelector from './QuantitySelector';

const CartPage: React.FC = () => {
  const { items, candles, loading, catalogError, count, subtotalCents, setQuantity, remove } = useCart();
  const unavailable = items.some(item => item.quantity > availableStock(candles.find(c => c.id === item.id)));
  return <ShopLayout step={1} title="Good scents, great choices." subtitle="A little atmosphere, ready to make its way to you.">
    {!items.length ? <div className="bg-white rounded-2xl border border-gray-200 py-20 px-6 text-center">
      <ShoppingBag size={36} strokeWidth={1.3} className="mx-auto text-[#829cc1] mb-5" />
      <h2 className="font-serif text-2xl mb-3">Your cart is waiting for a spark.</h2>
      <p className="text-gray-500 mb-7">Find a scent that feels like you.</p>
      <Link to="/" className={shopButton}>Explore the collection <ArrowRight size={16} /></Link>
    </div> : loading ? <p role="status">Loading your candles…</p> : catalogError ? <p role="alert" className="rounded-xl bg-amber-50 p-6">{catalogError} Your cart is saved. Refresh to try again.</p> : <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      <section aria-label="Cart items" className="bg-white rounded-2xl border border-gray-200 px-5 sm:px-7 divide-y divide-gray-100">
        {items.map(item => {
          const candle = candles.find(c => c.id === item.id);
          const stock = availableStock(candle);
          const available = stock > 0;
          return <article key={item.id} className="py-7 flex gap-4 sm:gap-6">
            {candle?.image ? <img src={candle.image} alt={candle.name} className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg object-cover bg-gray-100" /> : <div className="w-20 h-24 bg-gray-100 rounded-lg shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between">
                <h2 className="font-serif text-xl">{candle?.name || 'Unavailable candle'}</h2>
                <span className="font-semibold text-sm pt-1">{available ? money(Math.round(candle.price * 100) * item.quantity) : 'Unavailable'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{available ? `${candle.scent} · ${money(Math.round(candle.price * 100))} each` : 'Please remove this item to continue.'}</p>
              <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                <div>
                  <QuantitySelector name={candle?.name || 'candle'} quantity={item.quantity} min={1} max={quantityLimit(items, candle)} onChange={value => setQuantity(item.id, value)} />
                  {available && <p className="mt-2 text-xs text-gray-500">{item.quantity >= stock ? 'All available candles are in your cart.' : `${stock} available`}</p>}
                </div>
                <button onClick={() => remove(item.id)} aria-label={`Remove ${candle?.name || 'unavailable candle'}`} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-700 p-2"><Trash2 size={13} />Remove</button>
              </div>
            </div>
          </article>;
        })}
      </section>
      <aside className="rounded-2xl bg-[#edf1f6] p-6 sm:p-8 lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl mb-6">Your order</h2>
        <dl className="text-sm space-y-4">
          <div className="flex justify-between"><dt>Subtotal ({count} {count === 1 ? 'candle' : 'candles'})</dt><dd className="font-semibold">{money(subtotalCents)}</dd></div>
          <div className="flex justify-between gap-2"><dt>Shipping</dt><dd className="text-gray-500">Calculated at checkout</dd></div>
        </dl>
        <div className="border-t border-gray-300/60 mt-6 pt-6 flex justify-between items-center"><span className="font-semibold">Subtotal</span><span className="text-2xl font-serif">{money(subtotalCents)}</span></div>
        {unavailable ? <p role="alert" className="text-sm text-red-700 mt-5">Remove unavailable candles to continue.</p> : <Link to="/checkout" onMouseEnter={() => { void import('./CheckoutPage').catch(() => {}); }} onFocus={() => { void import('./CheckoutPage').catch(() => {}); }} className={`${shopButton} w-full mt-6`}>Continue to checkout <ArrowRight size={16} /></Link>}
        <p className="flex gap-2 text-xs leading-relaxed text-gray-500 mt-5"><Truck size={16} className="shrink-0 mt-0.5" />USPS shipping from Chicago. Choose your shipping service at checkout.</p>
        <p className="text-xs text-gray-500 mt-4">No payment collected yet. Taxes are not calculated.</p>
        {count >= MAX_ITEMS && <p role="status" className="text-xs mt-4">Maximum {MAX_ITEMS} candles per order.</p>}
      </aside>
    </div>}
  </ShopLayout>;
};
export default CartPage;
