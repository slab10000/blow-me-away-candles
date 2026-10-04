import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../lib/CartContext';

const StoreNav: React.FC = () => {
  const { count } = useCart();
  return <nav aria-label="Store navigation" className="fixed top-0 w-full z-50 bg-[#829cc1] border-b border-[#829cc1] shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20 gap-3">
      <Link to="/" className="font-serif text-xl sm:text-2xl font-bold text-gray-900 tracking-tighter whitespace-nowrap">Blow Me Away</Link>
      <div className="flex items-center gap-4 sm:gap-7">
        <a href="/#gallery" className="hidden md:block text-sm font-bold uppercase tracking-widest text-gray-900 hover:text-white">Collection</a>
        <a href="/#contact" className="hidden md:block text-sm font-bold uppercase tracking-widest text-gray-900 hover:text-white">Contact</a>
        <Link to="/cart" onMouseEnter={() => { void import('./CartPage').catch(() => {}); }} onFocus={() => { void import('./CartPage').catch(() => {}); }} aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`} className="flex items-center gap-2 rounded-full border border-gray-900/20 px-3 sm:px-4 py-2.5 text-gray-900 hover:bg-white/20 transition-colors">
          <ShoppingBag size={18} aria-hidden="true" /><span className="text-sm font-bold">Cart</span>
          <span className="min-w-5 h-5 px-1 rounded-full bg-gray-900 text-white text-xs inline-flex items-center justify-center">{count}</span>
        </Link>
      </div>
    </div>
  </nav>;
};
export default StoreNav;
