import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCandles } from '../lib/useCandles';
import { useCategoryMeta } from '../lib/useCategoryMeta';
import { ScentCategory } from '../types';
import CandleCard from './CandleCard';
import Footer from './Footer';

const CategoryPage: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const { candles, loading: catalogLoading } = useCandles();
  const { categoryMeta, loading: categoriesLoading } = useCategoryMeta();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const normalizedName =
    categoryName
      ? (categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase()) as ScentCategory
      : null;

  const meta = categoryMeta.find(m => m.name === normalizedName);
  const filtered = candles.filter(c => c.category === normalizedName);

  if (categoriesLoading || catalogLoading) return <p role="status" className="pt-32 text-center text-gray-500">Loading the collection…</p>;

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-xl">Category not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#829cc1] backdrop-blur-md border-b border-[#829cc1] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <a href="/" className="font-serif text-2xl font-bold text-gray-900 tracking-tighter">
              Blow Me Away
            </a>
            <div className="hidden md:flex space-x-8">
              <a href="/#gallery" className="text-gray-900 hover:text-gold-600 px-3 py-2 text-sm font-bold uppercase tracking-widest transition-colors">
                Collection
              </a>
              <a href="/#contact" className="text-gray-900 hover:text-gold-600 px-3 py-2 text-sm font-bold uppercase tracking-widest transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Category header */}
        <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-800 font-bold uppercase tracking-widest text-sm transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              Back to Collection
            </button>

            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-3">
              {meta.name}
            </h1>
            <div className="h-1 w-20 bg-gold-500 rounded-full mb-4" />
            <p className="text-xl text-gray-600 font-light max-w-xl">{meta.subtitle}</p>
            <p className="mt-3 text-sm text-gray-400 uppercase tracking-widest font-bold">
              {filtered.length} candle{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Candle grid */}
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-12">
              {filtered.map(candle => (
                <CandleCard key={candle.id} candle={candle} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
