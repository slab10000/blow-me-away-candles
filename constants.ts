import { Candle } from './types';

export const CANDLES: Candle[] = [
  {
    id: 'c1',
    name: 'Midnight Rain',
    description: 'A soothing blend of eucalyptus and fresh rain, designed to wash away the stress of the day.',
    image: 'https://picsum.photos/id/1015/800/800', // Nature/Water vibe
    audioSrc: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy_loud.ogg',
    price: 35,
    scentProfile: ['Eucalyptus', 'Petrichor', 'Lavender']
  },
  {
    id: 'c2',
    name: 'Golden Hour',
    description: 'Warm amber and vanilla bean capture the fleeting magic of sunset.',
    image: 'https://picsum.photos/id/1060/800/800', // Warm/Coffee vibe
    audioSrc: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    price: 32,
    scentProfile: ['Amber', 'Vanilla', 'Sandalwood']
  },
  {
    id: 'c3',
    name: 'Forest Whisper',
    description: 'Deep pine notes with a hint of cedarwood, bringing the tranquility of the woods indoors.',
    image: 'https://picsum.photos/id/1043/800/800', // Forest/Green
    audioSrc: 'https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg',
    price: 38,
    scentProfile: ['Pine', 'Cedarwood', 'Moss']
  },
  {
    id: 'c4',
    name: 'Seaside Drift',
    description: 'Salty sea spray meets delicate jasmine for a refreshing coastal escape.',
    image: 'https://picsum.photos/id/1050/800/800', // Ocean/Beach
    audioSrc: 'https://actions.google.com/sounds/v1/ambiences/soft_wind.ogg',
    price: 35,
    scentProfile: ['Sea Salt', 'Jasmine', 'Driftwood']
  },
  {
    id: 'c5',
    name: 'Spiced Hearth',
    description: 'Cinnamon, clove, and orange peel create the perfect cozy atmosphere for cold nights.',
    image: 'https://picsum.photos/id/312/800/800', // Fire/Warm
    audioSrc: 'https://actions.google.com/sounds/v1/ambiences/fire.ogg',
    price: 30,
    scentProfile: ['Cinnamon', 'Clove', 'Orange']
  },
  {
    id: 'c6',
    name: 'Zen Garden',
    description: 'White tea and ginger provide a clean, invigorating aroma for focus and clarity.',
    image: 'https://picsum.photos/id/292/800/800', // Tea/Simple
    audioSrc: 'https://actions.google.com/sounds/v1/ambiences/singing_bowl.ogg', // Approximate zen sound
    price: 34,
    scentProfile: ['White Tea', 'Ginger', 'Bamboo']
  }
];