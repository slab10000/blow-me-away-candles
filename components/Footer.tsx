import React from 'react';
import { Flame } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-12 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center space-x-2 mb-6 text-gold-500">
          <Flame size={32} />
          <span className="text-2xl font-serif font-bold text-white">Blow Me Away</span>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          © {new Date().getFullYear()} Blow Me Away Candles. All rights reserved.
        </p>
        <div className="flex justify-center space-x-8 text-sm text-gray-400 uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Shipping</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;