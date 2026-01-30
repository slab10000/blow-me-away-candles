import React, { useState } from 'react';
import { ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  const [isLit, setIsLit] = useState(false);

  return (
    <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/id/196/1920/1080" 
          alt="Candles Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Candle in Background */}
        <div className="absolute inset-0 flex items-end justify-center pb-24 pointer-events-none">
          <div className="scale-75 md:scale-90 lg:scale-100 opacity-80">
            <div className="holder">
              <div className="candle">
                <div className={`blinking-glow ${!isLit ? 'candle-part-hidden' : ''}`}></div>
                <div className={`glow ${!isLit ? 'candle-part-hidden' : ''}`}></div>
                <div className={`flame ${!isLit ? 'candle-part-hidden' : ''}`}></div>
                <div className="thread"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <span className="block text-gold-400 text-lg md:text-xl font-bold tracking-[0.2em] uppercase mb-4 animate-fade-in-down">
          Hand-poured Luxury
        </span>
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-white mb-8 tracking-tight drop-shadow-lg animate-fade-in-up">
          Blow Me Away
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 font-light mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
          More than just a scent. An auditory and olfactory journey into relaxation.
        </p>
        <div className="mt-10 flex flex-col items-center gap-6 animate-fade-in-up delay-300">
          <a 
            href="#gallery" 
            className="inline-block px-10 py-4 border-2 border-white text-white font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
          >
            Explore Collection
          </a>
          <button
            id="toggle-btn"
            onClick={() => setIsLit((prev) => !prev)}
            className="px-6 py-3 border border-white/70 text-white/90 rounded-full text-xs md:text-sm font-semibold tracking-[0.25em] uppercase bg-black/40 hover:bg-white hover:text-black transition-all duration-300"
          >
            {isLit ? 'Blow Out Candle' : 'Light Candle'}
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce z-10 text-white/70">
        <ArrowDown size={32} />
      </div>
    </div>
  );
};

export default Hero;