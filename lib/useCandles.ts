import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Candle } from '../types';

export function useCandles() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('candles')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setCandles(data as Candle[]);
        setLoading(false);
      });

    const channel = supabase
      .channel('candles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candles' }, () => {
        supabase
          .from('candles')
          .select('*')
          .order('created_at', { ascending: true })
          .then(({ data }) => {
            if (data) setCandles(data as Candle[]);
          });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { candles, loading };
}
