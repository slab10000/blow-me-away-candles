import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { generateCustomCandle } from '../services/geminiService';
import { GeneratedCandle, LoadingState } from '../types';

const AICustomizer: React.FC = () => {
  const [mood, setMood] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<GeneratedCandle | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood.trim()) return;

    setLoadingState(LoadingState.LOADING);
    setResult(null);

    try {
      const data = await generateCustomCandle(mood);
      setResult(data);
      setLoadingState(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gold-100 rounded-full mb-4">
            <Sparkles className="w-6 h-6 text-gold-600" />
          </div>
          <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
            The AI Sommelier
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Can't find the perfect scent? Tell us how you want to feel, or describe a memory, and our AI will craft a bespoke candle profile just for you.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          <form onSubmit={handleGenerate} className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g., 'Walking through an old library on a rainy day' or 'Sunday morning pancakes'"
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-500/20 transition-all placeholder-gray-400"
                disabled={loadingState === LoadingState.LOADING}
              />
              <button
                type="submit"
                disabled={loadingState === LoadingState.LOADING || !mood.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 bg-gray-900 text-white rounded-full font-bold hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loadingState === LoadingState.LOADING ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </form>

          {loadingState === LoadingState.ERROR && (
            <div className="text-red-500 bg-red-50 p-4 rounded-lg">
              Something went wrong. Please try a different prompt.
            </div>
          )}

          {result && (
            <div className="animate-fade-in-up">
              <div 
                className="relative overflow-hidden rounded-xl p-8 text-left transition-all duration-500"
                style={{
                  background: `linear-gradient(135deg, ${result.suggestedColor}20 0%, #ffffff 100%)`,
                  borderColor: result.suggestedColor,
                  borderWidth: '1px'
                }}
              >
                <div className="md:flex items-start justify-between">
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 bg-white/80 backdrop-blur text-xs font-bold tracking-wider uppercase mb-3 rounded-full border border-gray-200">
                      Your Custom Blend
                    </span>
                    <h3 className="text-3xl font-serif font-bold text-gray-900 mb-3">
                      {result.name}
                    </h3>
                    <p className="text-gray-700 text-lg italic mb-6 leading-relaxed">
                      "{result.description}"
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {result.notes.map((note, i) => (
                        <span key={i} className="px-4 py-2 bg-white shadow-sm text-gray-800 rounded-lg text-sm font-semibold border border-gray-100">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-8 md:mt-0 md:ml-8 flex-shrink-0 flex flex-col items-center">
                    <div 
                      className="w-32 h-32 rounded-full shadow-inner mb-4 flex items-center justify-center text-white font-serif text-3xl font-bold"
                      style={{ backgroundColor: result.suggestedColor }}
                    >
                      {result.name.charAt(0)}
                    </div>
                    <button className="w-full px-6 py-2 bg-gray-900 text-white text-sm font-bold uppercase tracking-wider rounded hover:bg-gray-800 transition-colors">
                      Pre-order Custom
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AICustomizer;