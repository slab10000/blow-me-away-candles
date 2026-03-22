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
}

export interface CustomScentRequest {
  mood: string;
  preferredNotes?: string;
}
