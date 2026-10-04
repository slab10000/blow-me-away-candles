const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_EDGE = 1200;

export async function prepareCandleImage(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP photo. Export HEIC photos as JPG first.');
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Choose a photo smaller than 20 MB.');
  const preview = URL.createObjectURL(file);
  const canvas = document.createElement('canvas');
  try {
    const image = new Image();
    image.src = preview;
    try { await image.decode(); }
    catch { throw new Error('This image could not be opened. Please choose a different photo.'); }
    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not prepare the image.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    // The encoder runs off the main thread and also supports Safari's missing WebP canvas encoder.
    const encoded = await new Promise<ArrayBuffer>((resolve, reject) => {
      const worker = new Worker(new URL('./webp.worker.ts', import.meta.url), { type: 'module' });
      const finish = () => { clearTimeout(timeout); worker.terminate(); };
      const timeout = window.setTimeout(() => {
        finish(); reject(new Error('Preparing the photo took too long. Please try a smaller image.'));
      }, 45000);
      worker.onmessage = ({ data }) => {
        finish();
        data.error ? reject(new Error(data.error)) : resolve(data.encoded);
      };
      worker.onerror = () => { finish(); reject(new Error('Photo preparation failed. Please try again.')); };
      worker.postMessage(pixels, [pixels.data.buffer]);
    });
    return new File([encoded], `${crypto.randomUUID()}.webp`, { type: 'image/webp' });
  } finally {
    URL.revokeObjectURL(preview);
    canvas.width = canvas.height = 0;
  }
}
