import type { Candle } from '../types.ts';

// Stock must be requested explicitly: an old wildcard response can omit a newly
// added column, which must never be mistaken for a sold-out candle.
export const CANDLE_FIELDS = 'id,name,artist,scent,description,image,spotifyTrackId,price,stock,scentProfile,category';

export function requireCandleStock(candle: Candle): Candle {
  if (!candle || !Number.isSafeInteger(candle.stock) || candle.stock < 0) {
    throw new Error('Candle availability could not be loaded. Please refresh and try again.');
  }
  return candle;
}

export function createCandleCatalog(load: (includeScentPhotos: boolean) => Promise<Candle[]>) {
  const snapshots = new Map<boolean, Candle[]>();
  const requests = new Map<boolean, Promise<Candle[]>>();
  let revision = 0;

  const fetchCatalog = (includeScentPhotos: boolean): Promise<Candle[]> => {
    const pending = requests.get(includeScentPhotos);
    if (pending) return pending;
    const requestedRevision = revision;
    const request = load(includeScentPhotos).then(rows => {
      // A request started before an admin save cannot restore the old stock.
      if (requestedRevision !== revision) return fetchCatalog(includeScentPhotos);
      const candles = rows.map(requireCandleStock);
      snapshots.set(includeScentPhotos, candles);
      return candles;
    }).finally(() => {
      if (requests.get(includeScentPhotos) === request) requests.delete(includeScentPhotos);
    });
    requests.set(includeScentPhotos, request);
    return request;
  };

  return {
    fetch: fetchCatalog,
    snapshot: (includeScentPhotos: boolean) => snapshots.get(includeScentPhotos),
    invalidate: () => { revision++; snapshots.clear(); requests.clear(); },
  };
}
