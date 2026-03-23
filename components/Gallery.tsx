import React from 'react';
import { CANDLES, CATEGORY_META } from '../constants';
import CategoryCarousel from './CategoryCarousel';

const Gallery: React.FC = () => {
  return (
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            The Collection
          </h2>
          <div className="h-1 w-24 bg-gold-500 mx-auto rounded-full" />
          <p className="mt-4 text-xl text-gray-600 font-light">
            Each scent paired with a song that captures its soul.
          </p>
        </div>

        {/* Four category carousels */}
        <div className="space-y-16">
          {CATEGORY_META.map(meta => (
            <CategoryCarousel
              key={meta.name}
              meta={meta}
              candles={CANDLES.filter(c => c.category === meta.name)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
