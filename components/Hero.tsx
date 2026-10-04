import React, { useRef, useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import heroBg from '@/Images/hero_section_bg.webp';
import heroLitBg from '@/Images/hero_section_lit_bg.webp';
import Flame from './Flame';

/** Flame position/size as % of background image (0–100). Tune to match the candle in your image. */
const FLAME_IMAGE_LEFT = 49.8;
const FLAME_IMAGE_TOP = 29;
const FLAME_SIZE_PERCENT_OF_IMAGE_HEIGHT = 10;

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [flameLayout, setFlameLayout] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [resizeTick, setResizeTick] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLit, setIsLit] = useState(true);

  useEffect(() => {
    const onResize = () => setResizeTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const img = imageRef.current;
    if (!container || !img || !imageLoaded || !img.naturalWidth) return;

    const W = container.offsetWidth;
    const H = container.offsetHeight;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const scale = Math.max(W / nw, H / nh);

    const px = (FLAME_IMAGE_LEFT / 100) * nw;
    const py = (FLAME_IMAGE_TOP / 100) * nh;
    const left = W / 2 + scale * (px - nw / 2);
    const top = H / 2 + scale * (py - nh / 2);
    const height = (FLAME_SIZE_PERCENT_OF_IMAGE_HEIGHT / 100) * H;
    const width = height * 0.4;

    setFlameLayout({ left, top, width, height });
  }, [resizeTick, imageLoaded]);

  const handleHeroClick = () => {
    setIsLit((prev) => !prev);
    setImageLoaded(false);
  };

  const isNoToggleTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('[data-hero-no-toggle], a, button'));
  };

  return (
    <div
      ref={containerRef}
      className="flame-zone relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden"
      onClickCapture={(e) => {
        if (isNoToggleTarget(e.target)) return;
        handleHeroClick();
      }}
      onKeyDown={(e) => e.key === 'Enter' && handleHeroClick()}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
      aria-label={isLit ? 'Click to blow out the candle' : 'Click to light the candle'}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          ref={imageRef}
          src={isLit ? heroLitBg : heroBg}
          alt="Candles Background"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover transition-opacity duration-500"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      {/* Animated flame – visible only when lit */}
      {isLit && flameLayout && <Flame layout={flameLayout} />}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto cursor-pointer">
        <span className="block text-gold-400 text-lg md:text-xl font-bold tracking-[0.2em] uppercase mb-4 animate-fade-in-down">
          Hand-poured Luxury
        </span>
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-white mb-8 tracking-tight drop-shadow-lg animate-fade-in-up">
          Blow Me Away
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 font-light mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
          More than just a scent. An auditory and olfactory journey into relaxation.
        </p>
        <div className="animate-fade-in-up delay-300">
          <a 
            href="#gallery" 
            className="inline-block px-10 py-4 border-2 border-white text-white font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
            data-hero-no-toggle
            onClick={(e) => e.stopPropagation()}
          >
            Explore Collection
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce z-10 text-white/70" data-hero-no-toggle onClick={(e) => e.stopPropagation()}>
        <ArrowDown size={32} />
      </div>
    </div>
  );
};

export default Hero;
