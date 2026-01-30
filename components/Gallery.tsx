import React, { useState } from 'react';
import CandleCard from './CandleCard';
import { CANDLES } from '../constants';

const Gallery: React.FC = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlayToggle = (id: string) => {
    setPlayingId(prevId => prevId === id ? null : id);
  };

  return (
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            The Collection
          </h2>
          <div className="h-1 w-24 bg-gold-500 mx-auto rounded-full"></div>
          <p className="mt-4 text-xl text-gray-600 font-light">
            Click play to experience the ambiance of each scent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-12">
          {CANDLES.map(candle => (
            <CandleCard 
              key={candle.id} 
              candle={candle} 
              isPlaying={playingId === candle.id}
              onPlayToggle={handlePlayToggle}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;