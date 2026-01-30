import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { Candle } from '../types';

interface CandleCardProps {
  candle: Candle;
  isPlaying: boolean;
  onPlayToggle: (id: string) => void;
}

const CandleCard: React.FC<CandleCardProps> = ({ candle, isPlaying, onPlayToggle }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="group relative bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      {/* Image Container */}
      <div className="relative h-80 w-full overflow-hidden">
        <img 
          src={candle.image} 
          alt={candle.name} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
        
        {/* Play Button Overlay */}
        <button
          onClick={() => onPlayToggle(candle.id)}
          className="absolute inset-0 m-auto h-16 w-16 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/50 text-white transition-transform duration-300 hover:scale-110 hover:bg-white/30 focus:outline-none"
          aria-label={isPlaying ? "Pause ambient sound" : "Play ambient sound"}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </button>

        {/* Audio Element */}
        <audio 
          ref={audioRef} 
          src={candle.audioSrc} 
          loop 
          crossOrigin="anonymous"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-serif font-bold text-gray-900">{candle.name}</h3>
          <span className="text-lg font-sans font-semibold text-gold-600">${candle.price}</span>
        </div>
        <p className="text-gray-600 font-sans mb-4 line-clamp-2 min-h-[3rem]">
          {candle.description}
        </p>
        
        {/* Notes Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {candle.scentProfile.map((note, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full">
              {note}
            </span>
          ))}
        </div>

        <button className="w-full py-3 bg-gray-900 text-white font-bold uppercase tracking-widest hover:bg-gold-600 transition-colors duration-300">
          Add to Cart
        </button>
      </div>

      {/* Playing Indicator */}
      {isPlaying && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-gold-500/90 backdrop-blur px-3 py-1 rounded-full text-white text-xs font-bold animate-pulse">
          <Music className="w-3 h-3" />
          <span>PLAYING</span>
        </div>
      )}
    </div>
  );
};

export default CandleCard;