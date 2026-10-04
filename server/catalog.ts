import { availableStock } from '../shared/inventory.ts';
import type { InventoryItem } from '../shared/inventory.ts';
import type { CartItem, OrderLine } from '../shared/commerce.ts';
import { CheckoutError } from './errors.ts';

interface CatalogCandle extends InventoryItem { name: string; image: string }

export function buildOrderLines(items: CartItem[], candles: CatalogCandle[]): OrderLine[] {
  return items.map(item => {
    const candle = candles.find(c => c.id === item.id);
    if (!candle) throw new CheckoutError('A candle in your cart is no longer available. Please update your cart.', 409, 'CART_CHANGED');
    const stock = availableStock(candle);
    if (item.quantity > stock) {
      const message = stock > 0 ? `Only ${stock} of ${candle.name} ${stock === 1 ? 'is' : 'are'} available.` : `${candle.name} is sold out.`;
      throw new CheckoutError(`${message} Please update your cart.`, 409, 'CART_CHANGED');
    }
    return { id: item.id, quantity: item.quantity, name: candle.name, image: candle.image, unitPriceCents: Math.round(Number(candle.price) * 100) };
  });
}
