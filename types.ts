export type ScentCategory = 'Fresh' | 'Warm' | 'Floral' | 'Earthy';

export interface CategoryMeta {
  name: ScentCategory;
  subtitle: string;
}

export interface Candle {
  id: string;
  name: string;
  artist: string;
  scent: string;
  description: string;
  image: string;
  spotifyTrackId: string;
  price: number;
  scentProfile: string[];
  category: ScentCategory;
}

export interface CustomScentRequest {
  mood: string;
  preferredNotes?: string;
}
