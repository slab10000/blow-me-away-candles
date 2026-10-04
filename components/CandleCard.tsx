import React from 'react';
import { Candle } from '../types';
import SpotifyPreview from './SpotifyPreview';
import { useCart } from '../lib/CartContext';
import { money } from '../shared/commerce';
import { availableStock, quantityLimit } from '../shared/inventory';
import QuantitySelector from './QuantitySelector';

interface CandleCardProps {
  candle: Candle;
}

const CandleCard: React.FC<CandleCardProps> = ({ candle }) => {
  const { add, items, setQuantity, loading, catalogError } = useCart();
  const quantity = items.find(item => item.id === candle.id)?.quantity || 0;
  const stock = availableStock(candle);
  const max = loading || catalogError ? 0 : quantityLimit(items, candle);
  return (
    <div className="group bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full">
      {/* Image */}
      <div className="relative h-72 w-full overflow-hidden flex-none">
        <img
          src={candle.image}
          alt={candle.scent}
          width={800}
          height={800}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      {/* Spotify Embed */}
      <SpotifyPreview trackId={candle.spotifyTrackId} title={`${candle.name} by ${candle.artist}`} />

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-serif font-bold text-gray-900 leading-tight pr-3">{candle.name}</h3>
          <span className="text-lg font-sans font-semibold text-gold-600 whitespace-nowrap">{money(Math.round(candle.price * 100))}</span>
        </div>
        <p className="text-gray-600 font-sans mb-4 line-clamp-2 min-h-[3rem]">
          {candle.description}
        </p>

        {/* Scent Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {candle.scentProfile.map((note, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full">
              {note}
            </span>
          ))}
        </div>

        <div className="mt-auto">
          <p className={`mb-2 text-xs ${stock > 0 ? 'text-gray-500' : 'text-gray-400'}`}>
            {stock > 0 ? `${stock} available${quantity >= stock ? ' · All in your cart' : ''}` : 'Currently unavailable'}
          </p>
          {quantity > 0 ? <QuantitySelector name={candle.name} quantity={quantity} max={max} onChange={value => setQuantity(candle.id, value)} className="w-full" /> : <button type="button" onClick={() => add(candle)} disabled={max <= 0} aria-label={stock > 0 ? `Add ${candle.name} to cart` : `${candle.name} is sold out`} className="h-12 w-full py-3 bg-gray-900 text-white font-bold uppercase tracking-widest hover:bg-gold-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
            {stock > 0 ? 'Add to Cart' : 'Sold Out'}
          </button>}
        </div>
      </div>
    </div>
  );
};

export default CandleCard;
