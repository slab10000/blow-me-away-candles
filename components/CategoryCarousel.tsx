import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CandleCard from './CandleCard';
import { Candle, CategoryMeta } from '../types';

interface CategoryCarouselProps {
  meta: CategoryMeta;
  candles: Candle[];
}

const SCROLL_AMOUNT = 320;

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ meta, candles }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
  };

  return (
    <section>
      {/* Header row */}
      <div className="flex items-end justify-between mb-6 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">{meta.name}</h2>
          <p className="mt-1 text-gray-500 font-light">{meta.subtitle}</p>
        </div>
        <Link
          to={`/category/${meta.name.toLowerCase()}`}
          onMouseEnter={() => { void import('./CategoryPage').catch(() => {}); }}
          onFocus={() => { void import('./CategoryPage').catch(() => {}); }}
          onClick={() => sessionStorage.setItem('galleryScrollY', String(window.scrollY))}
          className="text-gold-600 hover:text-gold-800 font-bold uppercase tracking-widest text-sm transition-colors whitespace-nowrap ml-4"
        >
          View All →
        </Link>
      </div>

      {/* Carousel + arrows */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={scrollLeft}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10
            hidden md:flex items-center justify-center
            w-10 h-10 rounded-full border border-gray-200 bg-white/90 backdrop-blur
            text-gray-700 hover:border-gold-400 hover:text-gold-600 transition-colors shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 px-4 sm:px-6 lg:px-8 snap-x snap-mandatory scrollbar-hide"
        >
          {candles.map(candle => (
            <div key={candle.id} className="flex-none w-72 snap-start flex flex-col">
              <CandleCard candle={candle} />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={scrollRight}
          aria-label="Scroll right"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10
            hidden md:flex items-center justify-center
            w-10 h-10 rounded-full border border-gray-200 bg-white/90 backdrop-blur
            text-gray-700 hover:border-gold-400 hover:text-gold-600 transition-colors shadow-sm"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
};

export default CategoryCarousel;
