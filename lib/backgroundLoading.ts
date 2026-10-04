import { createBackgroundQueue } from '../shared/backgroundQueue';

export const spotifyLoads = createBackgroundQueue();
let pageReady: Promise<void> | undefined;

export function afterPageReady(work: () => void) {
  if (!pageReady) {
    pageReady = new Promise<void>(resolve => {
      let started = false;
      const idle = () => {
        if (started) return;
        started = true;
        window.removeEventListener('load', idle);
        clearTimeout(deadline);
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(() => resolve(), { timeout: 750 });
        } else window.setTimeout(resolve, 150);
      };
      // A slow font or other external request must not postpone background work forever.
      const deadline = window.setTimeout(idle, 1500);
      if (document.readyState === 'complete') idle();
      else window.addEventListener('load', idle, { once: true });
    });
  }
  let cancelled = false;
  void pageReady.then(() => { if (!cancelled) work(); });
  return () => { cancelled = true; };
}
