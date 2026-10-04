import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import StoreNav from './StoreNav';
import Footer from './Footer';

export const shopButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-[#566f93] disabled:cursor-not-allowed disabled:opacity-50';

const ShopLayout: React.FC<React.PropsWithChildren<{ step: number; title: string; subtitle: string }>> = ({ children, step, title, subtitle }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return <div className="min-h-screen bg-[#faf9f6] text-gray-900">
    <StoreNav />
    <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-28 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8"><ArrowLeft size={15} />Continue shopping</Link>
      <ol aria-label="Checkout progress" className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs uppercase tracking-[0.15em] mb-7">
        {['Your cart', 'Delivery', 'Review'].map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={`flex items-center gap-2 ${step >= index + 1 ? 'text-gray-900' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-[10px] ${step >= index + 1 ? 'bg-[#dce4ef] text-gray-900' : 'bg-gray-100'}`}>{index + 1}</span>{label}
        </li>)}
      </ol>
      <h1 className="font-serif text-4xl sm:text-5xl tracking-tight">{title}</h1>
      <p className="mt-3 mb-10 text-gray-500 leading-relaxed">{subtitle}</p>
      {children}
    </main>
    <Footer />
  </div>;
};
export default ShopLayout;
