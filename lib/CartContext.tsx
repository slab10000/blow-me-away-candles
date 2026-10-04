import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Candle } from '../types';
import { CART_KEY, MAX_ITEMS, parseCart } from '../shared/commerce';
import type { CartItem } from '../shared/commerce';
import { useCandles } from './useCandles';
import { availableStock, quantityLimit, reconcileCart, updateCartQuantity } from '../shared/inventory';

function readItems(): CartItem[] {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(saved) && saved.length === 0 ? [] : parseCart(saved);
  } catch { return []; }
}
interface CartContextValue {
  items: CartItem[];
  candles: Candle[];
  loading: boolean;
  catalogError: string;
  count: number;
  subtotalCents: number;
  notice: string;
  add: (candle: Candle) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  consume: (purchased: CartItem[]) => void;
}
const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [savedItems, setItems] = useState<CartItem[]>(readItems);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const { candles, loading, error: catalogError } = useCandles();
  const ready = !loading && !catalogError;
  const items = useMemo(() => ready ? reconcileCart(savedItems, candles) : savedItems, [savedItems, candles, ready]);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (items === savedItems) return;
    setItems(current => reconcileCart(current, candles));
    setNotice('Your cart was updated to match the available candles.');
  }, [items, savedItems, candles]);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [items]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === CART_KEY || event.key === null) setItems(readItems()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const add = (candle: Candle) => {
    if (!ready) { setNotice('Please wait for the collection to load before adding candles.'); return; }
    const currentCandle = candles.find(c => c.id === candle.id);
    const quantity = items.find(item => item.id === candle.id)?.quantity || 0;
    if (!availableStock(currentCandle)) { setNotice(`${candle.name} is sold out.`); return; }
    if (count >= MAX_ITEMS) { setNotice(`You can order up to ${MAX_ITEMS} candles at a time.`); return; }
    if (quantity >= quantityLimit(items, currentCandle)) { setNotice(`All available ${candle.name} candles are already in your cart.`); return; }
    setItems(current => {
      const reconciled = reconcileCart(current, candles);
      const nextQuantity = (reconciled.find(item => item.id === candle.id)?.quantity || 0) + 1;
      return updateCartQuantity(reconciled, candles, candle.id, nextQuantity);
    });
    setNotice(`${candle.name} added to your cart.`);
  };
  const setQuantity = (id: string, quantity: number) => {
    if (!ready) return;
    setItems(current => updateCartQuantity(reconcileCart(current, candles), candles, id, quantity));
  };
  const consume = (purchased: CartItem[]) => setItems(current => current.map(item => ({ ...item, quantity: item.quantity - (purchased.find(p => p.id === item.id)?.quantity || 0) })).filter(item => item.quantity > 0));
  const subtotalCents = items.reduce((sum, item) => sum + Math.round((candles.find(c => c.id === item.id)?.price || 0) * 100) * item.quantity, 0);

  return <CartContext.Provider value={{ items, candles, loading, catalogError, count, subtotalCents, notice, add, setQuantity, remove: id => setItems(current => current.filter(item => item.id !== id)), consume }}>
    {children}
    <div role="status" aria-live="polite" className={notice || storageError ? 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md rounded-xl bg-gray-900 px-5 py-4 text-center text-sm text-white shadow-xl' : 'sr-only'}>
      {notice || (storageError ? 'Your browser cannot save this cart. Keep this tab open while shopping.' : '')}
    </div>
  </CartContext.Provider>;
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('CartProvider is missing.');
  return context;
}
