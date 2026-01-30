export interface Candle {
  id: string;
  name: string;
  description: string;
  image: string;
  audioSrc: string;
  price: number;
  scentProfile: string[];
}

export interface CustomScentRequest {
  mood: string;
  preferredNotes?: string;
}
