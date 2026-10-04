import type { SupabaseClient } from '@supabase/supabase-js';

interface CandleImage { id: string; image: string }
export interface ScentImages {
  id: string;
  heroImage: string | null;
  products: { images: string[] | null }[];
}

function isPhoto(image: string | null | undefined): image is string {
  if (!image?.trim()) return false;
  try {
    const url = new URL(image);
    return ['http:', 'https:'].includes(url.protocol)
      && url.hostname !== 'picsum.photos' && !url.hostname.endsWith('.picsum.photos');
  } catch { return image.startsWith('/'); }
}

export function resolveCandleImages<T extends CandleImage>(candles: T[], scents: ScentImages[]): T[] {
  const byId = new Map(scents.map(scent => [scent.id, scent]));
  return candles.map(candle => {
    // Keep images uploaded directly through the candle editor.
    if (isPhoto(candle.image)) return candle;
    // The scent/product migration preserved this exact relationship.
    const scent = byId.get(`s${candle.id}`);
    if (!scent) return candle;
    const image = isPhoto(scent.heroImage) ? scent.heroImage
      : scent.products.flatMap(product => product.images || []).find(isPhoto);
    return image ? { ...candle, image } : candle;
  });
}

export async function loadCandleImages<T extends CandleImage>(db: SupabaseClient, candles: T[]): Promise<T[]> {
  const scentIds = candles.filter(candle => !isPhoto(candle.image)).map(candle => `s${candle.id}`);
  if (!scentIds.length) return candles;
  return resolveCandleImages(candles, await loadScentImages(db, scentIds));
}

export async function loadScentImages(db: SupabaseClient, scentIds?: string[]): Promise<ScentImages[]> {
  let query = db.from('scents')
    .select('id,heroImage,products(images)')
    .order('created_at', { referencedTable: 'products', ascending: true })
    .abortSignal(AbortSignal.timeout(10000));
  if (scentIds) query = query.in('id', scentIds);
  const { data, error } = await query;
  // Photo availability must not prevent the collection or checkout from loading.
  if (error) {
    console.warn('Catalog photos could not be loaded; using the saved candle images.');
    return [];
  }
  return (data || []) as ScentImages[];
}
