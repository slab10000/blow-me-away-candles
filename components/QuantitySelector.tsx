import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  name: string;
  quantity: number;
  max: number;
  min?: number;
  onChange: (quantity: number) => void;
  className?: string;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ name, quantity, max, min = 0, onChange, className = '' }) => (
  <div role="group" aria-label={`${name} quantity`} className={`inline-flex h-12 items-center justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 ${className}`}>
    <button type="button" onClick={() => onChange(quantity - 1)} disabled={quantity <= min} aria-label={`Decrease ${name} quantity`} className="flex h-full min-w-12 items-center justify-center rounded-l-2xl transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white">
      <Minus size={20} strokeWidth={1.75} />
    </button>
    <span aria-live="polite" aria-atomic="true" aria-label={`Quantity: ${quantity}`} className="min-w-8 text-center text-lg font-medium tabular-nums">{quantity}</span>
    <button type="button" onClick={() => onChange(quantity + 1)} disabled={quantity >= max} aria-label={`Increase ${name} quantity`} className="flex h-full min-w-12 items-center justify-center rounded-r-2xl transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white">
      <Plus size={20} strokeWidth={1.75} />
    </button>
  </div>
);

export default QuantitySelector;
