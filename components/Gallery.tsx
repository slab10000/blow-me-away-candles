import React from 'react';
import CandleCard from './CandleCard';
import { CANDLES } from '../constants';

const Gallery: React.FC = () => {
  return (
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            The Collection
          </h2>
          <div className="h-1 w-24 bg-gold-500 mx-auto rounded-full"></div>
          <p className="mt-4 text-xl text-gray-600 font-light">
            Each scent paired with a song that captures its soul.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-12">
          {CANDLES.map(candle => (
            <CandleCard
              key={candle.id}
              candle={candle}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
