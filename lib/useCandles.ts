import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Candle } from '../types';
import { loadCandleImages } from '../shared/catalogImages';

export function useCandles({ includeScentPhotos = true } = {}) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let latestRequest = 0;
    const load = async () => {
      const request = ++latestRequest;
      try {
        const { data, error } = await supabase.from('candles').select('*')
          .order('created_at', { ascending: true });
        if (error) throw error;
        const rows = (data || []) as Candle[];
        const catalog = includeScentPhotos ? await loadCandleImages(supabase, rows) : rows;
        if (active && request === latestRequest) {
          setCandles(catalog);
          setError('');
        }
      } catch {
        if (active && request === latestRequest) setError('The collection could not be loaded.');
      } finally {
        if (active && request === latestRequest) setLoading(false);
      }
    };
    void load();

    const channel = supabase
      .channel(includeScentPhotos ? 'storefront-candles' : 'admin-candles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candles' }, load)
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [includeScentPhotos]);

  return { candles, loading, error };
}
