import encode, { init } from '@jsquash/webp/encode.js';
import wasm from '@jsquash/webp/codec/enc/webp_enc.wasm?url';
import simdWasm from '@jsquash/webp/codec/enc/webp_enc_simd.wasm?url';

self.onmessage = async ({ data }: MessageEvent<ImageData>) => {
  try {
    await init({ locateFile: path => path.includes('simd') ? simdWasm : wasm });
    const encoded = await encode(data, { quality: 82 });
    self.postMessage({ encoded }, { transfer: [encoded] });
  } catch {
    self.postMessage({ error: 'The photo could not be optimized. Please try a JPG, PNG, or WebP image.' });
  }
};
