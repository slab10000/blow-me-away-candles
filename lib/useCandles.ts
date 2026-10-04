import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Candle } from '../types';
import { loadScentImages, resolveCandleImages } from '../shared/catalogImages';

// Keep navigation instant, refresh on every mount, and share concurrent requests.
// Admin rows stay separate so borrowed photos never enter the deletion workflow.
const snapshots = new Map<boolean, Candle[]>();
const requests = new Map<boolean, Promise<Candle[]>>();

function fetchCatalog(includeScentPhotos: boolean): Promise<Candle[]> {
  const pending = requests.get(includeScentPhotos);
  if (pending) return pending;
  const request = Promise.all([
    supabase.from('candles').select('*').order('created_at', { ascending: true }),
    includeScentPhotos ? loadScentImages(supabase) : Promise.resolve([]),
  ]).then(([{ data, error }, scents]) => {
    if (error) throw error;
    const rows = (data || []) as Candle[];
    const catalog = includeScentPhotos ? resolveCandleImages(rows, scents) : rows;
    snapshots.set(includeScentPhotos, catalog);
    return catalog;
  }).finally(() => { requests.delete(includeScentPhotos); });
  requests.set(includeScentPhotos, request);
  return request;
}

export function useCandles({ includeScentPhotos = true } = {}) {
  const [candles, setCandles] = useState<Candle[]>(() => snapshots.get(includeScentPhotos) || []);
  const [loading, setLoading] = useState(() => !snapshots.has(includeScentPhotos));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let latestRequest = 0;
    const load = async () => {
      const request = ++latestRequest;
      try {
        const catalog = await fetchCatalog(includeScentPhotos);
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
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') void load(); };
    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener('online', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    const channel = supabase
      .channel(includeScentPhotos ? 'storefront-candles' : 'admin-candles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candles' }, load)
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener('focus', refreshWhenVisible);
      window.removeEventListener('online', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      supabase.removeChannel(channel);
    };
  }, [includeScentPhotos]);

  return { candles, loading, error };
}
