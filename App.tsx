import React from 'react';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import Contact from './components/Contact';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full z-50 bg-[#829cc1] backdrop-blur-md border-b border-[#829cc1] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-serif text-2xl font-bold text-gray-900 tracking-tighter">
                Blow Me Away
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#gallery" className="text-gray-900 hover:text-gold-600 px-3 py-2 text-sm font-bold uppercase tracking-widest transition-colors">Collection</a>
              <a href="#contact" className="text-gray-900 hover:text-gold-600 px-3 py-2 text-sm font-bold uppercase tracking-widest transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Hero />
        <Gallery />
        <Contact />
      </main>

      <Footer />
    </div>
  );
};

export default App;
