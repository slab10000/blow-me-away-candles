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

export interface GeneratedCandle {
  name: string;
  description: string;
  notes: string[];
  suggestedColor: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}