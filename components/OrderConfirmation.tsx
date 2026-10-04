import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import type { OrderReceipt } from '../shared/commerce';
import { money } from '../shared/commerce';
import { RECEIPT_KEY } from './CheckoutPage';
import ShopLayout, { shopButton } from './ShopLayout';

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  let receipt: OrderReceipt | null = location.state;
  if (!receipt) {
    try { receipt = JSON.parse(sessionStorage.getItem(RECEIPT_KEY) || 'null'); } catch { /* No saved receipt. */ }
  }
  if (!receipt || receipt.status !== 'pending_payment' || !Array.isArray(receipt.items) || !Number.isInteger(receipt.totalCents)) return <ShopLayout step={3} title="Your next favorite scent awaits." subtitle="There is no saved order in this tab yet."><Link to="/cart" className={shopButton}>Go to your cart</Link></ShopLayout>;

  return <ShopLayout step={3} title="Your order is saved." subtitle="A little closer to a room that feels like you.">
    <section className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 sm:p-10">
      <div className="w-12 h-12 rounded-full bg-[#e7ede3] text-[#506442] flex items-center justify-center mb-6"><Check size={24} /></div>
      <div className="flex flex-wrap justify-between items-start gap-3"><h2 className="font-serif text-2xl">Thank you for your order.</h2><span className="text-xs px-3 py-1.5 bg-amber-50 text-amber-800 rounded-full">Payment pending</span></div>
      <p className="text-xs text-gray-500 mt-3 break-all">Order {receipt.number}</p>
      <p className="text-sm leading-relaxed text-gray-600 mt-5">Your candles and delivery details have been saved. No payment has been collected, and your order will not ship until payment is available and completed.</p>
      <ul className="border-y border-gray-100 py-5 my-6 space-y-4">{receipt.items.map(item => <li key={item.id} className="flex justify-between gap-4 text-sm"><span>{item.name} <span className="text-gray-400">× {item.quantity}</span></span><span>{money(item.unitPriceCents * item.quantity)}</span></li>)}</ul>
      <dl className="text-sm space-y-4"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(receipt.subtotalCents)}</dd></div><div className="flex justify-between gap-3"><dt>{receipt.shippingLabel}</dt><dd>{money(receipt.shippingCents)}</dd></div><div className="flex justify-between border-t border-gray-100 pt-5 font-semibold"><dt>Estimated total</dt><dd>{money(receipt.totalCents)}</dd></div></dl>
      <p className="text-xs text-gray-500 mt-3">Taxes are not calculated. Shipping will be rechecked before payment.</p>
      <Link to="/" className={`${shopButton} mt-8 w-full`}>Back to the collection <ArrowRight size={16} /></Link>
    </section>
  </ShopLayout>;
};
export default OrderConfirmation;
