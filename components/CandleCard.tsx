import React from 'react';
import { Candle } from '../types';
import SpotifyPreview from './SpotifyPreview';

interface CandleCardProps {
  candle: Candle;
}

const CandleCard: React.FC<CandleCardProps> = ({ candle }) => {
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
          <span className="text-lg font-sans font-semibold text-gold-600 whitespace-nowrap">${candle.price}</span>
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

        <button className="mt-auto w-full py-3 bg-gray-900 text-white font-bold uppercase tracking-widest hover:bg-gold-600 transition-colors duration-300">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default CandleCard;
