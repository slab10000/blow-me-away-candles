import { MAX_ITEMS } from './commerce.ts';
import type { CartItem } from './commerce.ts';

export interface InventoryItem { id: string; stock?: number; price: number }

// Missing inventory is unavailable until an administrator sets a count.
export function availableStock(candle: InventoryItem | undefined): number {
  return candle && Number.isSafeInteger(candle.stock) && candle.stock! > 0
    && Number.isFinite(Number(candle.price)) && Number(candle.price) > 0 ? candle.stock! : 0;
}

export function quantityLimit(items: CartItem[], candle: InventoryItem | undefined): number {
  const otherCount = items.reduce((sum, item) => sum + (item.id === candle?.id ? 0 : item.quantity), 0);
  return Math.max(0, Math.min(availableStock(candle), MAX_ITEMS - otherCount));
}

export function reconcileCart(items: CartItem[], candles: InventoryItem[]): CartItem[] {
  let remaining = MAX_ITEMS;
  const next = items.flatMap(item => {
    const quantity = Math.min(item.quantity, availableStock(candles.find(c => c.id === item.id)), remaining);
    remaining -= quantity;
    return quantity > 0 ? [{ ...item, quantity }] : [];
  });
  return next.length === items.length && next.every((item, i) => item.quantity === items[i].quantity) ? items : next;
}

export function updateCartQuantity(items: CartItem[], candles: InventoryItem[], id: string, quantity: number): CartItem[] {
  if (!Number.isSafeInteger(quantity) || quantity < 0) return items;
  if (quantity === 0) return items.filter(item => item.id !== id);
  const candle = candles.find(c => c.id === id);
  const allowed = Math.min(quantity, quantityLimit(items, candle));
  if (allowed <= 0) return items;
  return items.some(item => item.id === id)
    ? items.map(item => item.id === id ? { ...item, quantity: allowed } : item)
    : [...items, { id, quantity: allowed }];
}
