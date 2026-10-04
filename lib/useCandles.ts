import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Candle } from '../types';
import { loadScentImages, resolveCandleImages } from '../shared/catalogImages';
import { CANDLE_FIELDS, createCandleCatalog } from '../shared/candleCatalog';

// Keep navigation instant, refresh on every mount, and share concurrent requests.
// Admin rows stay separate so borrowed photos never enter the deletion workflow.
const catalog = createCandleCatalog(async includeScentPhotos => {
  const [{ data, error }, scents] = await Promise.all([
    supabase.from('candles').select(CANDLE_FIELDS).order('created_at', { ascending: true })
      .abortSignal(AbortSignal.timeout(10000)),
    includeScentPhotos ? loadScentImages(supabase) : Promise.resolve([]),
  ]);
  if (error) throw error;
  const rows = (data || []) as Candle[];
  return includeScentPhotos ? resolveCandleImages(rows, scents) : rows;
});

const CATALOG_UPDATED = 'candle-catalog-updated';
export function invalidateCandles() {
  catalog.invalidate();
  window.dispatchEvent(new Event(CATALOG_UPDATED));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CATALOG_UPDATED);
    channel.postMessage('refresh');
    channel.close();
  }
}

export function useCandles({ includeScentPhotos = true } = {}) {
  const [candles, setCandles] = useState<Candle[]>(() => catalog.snapshot(includeScentPhotos) || []);
  const [loading, setLoading] = useState(() => !catalog.snapshot(includeScentPhotos));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let latestRequest = 0;
    const load = async () => {
      const request = ++latestRequest;
      try {
        const candles = await catalog.fetch(includeScentPhotos);
        if (active && request === latestRequest) {
          setCandles(candles);
          setError('');
        }
      } catch {
        if (active && request === latestRequest) setError('The collection and its availability could not be loaded.');
      } finally {
        if (active && request === latestRequest) setLoading(false);
      }
    };
    void load();
    const refresh = () => { catalog.invalidate(); void load(); };
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener('online', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener(CATALOG_UPDATED, load);
    const broadcast = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CATALOG_UPDATED) : null;
    if (broadcast) broadcast.onmessage = refresh;

    const channel = supabase
      .channel(includeScentPhotos ? 'storefront-candles' : 'admin-candles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candles' }, refresh)
      .subscribe(status => { if (status === 'SUBSCRIBED') refresh(); });

    return () => {
      active = false;
      window.removeEventListener('focus', refreshWhenVisible);
      window.removeEventListener('online', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener(CATALOG_UPDATED, load);
      broadcast?.close();
      supabase.removeChannel(channel);
    };
  }, [includeScentPhotos]);

  return { candles, loading, error };
}
