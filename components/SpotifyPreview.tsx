import React, { useEffect, useRef, useState } from 'react';
import { afterPageReady, spotifyLoads } from '../lib/backgroundLoading';

export default function SpotifyPreview({ trackId, title }: { trackId: string; title: string }) {
  return <SpotifyPlayer key={trackId} trackId={trackId} title={title} />;
}

const SpotifyPlayer: React.FC<{ trackId: string; title: string }> = ({ trackId, title }) => {
  const container = useRef<HTMLDivElement>(null);
  const ticket = useRef<ReturnType<typeof spotifyLoads.enqueue> | null>(null);
  const [started, setStarted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let nearby = false;
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        nearby = true;
        ticket.current?.prioritize();
        observer?.disconnect();
      }
    }, { rootMargin: '800px' });
    if (container.current) observer?.observe(container.current);
    const cancelReady = afterPageReady(() => {
      ticket.current = spotifyLoads.enqueue(() => setStarted(true), nearby ? 1 : 0);
    });
    return () => { cancelReady(); observer?.disconnect(); ticket.current?.cancel(); };
  }, []);
  return <div ref={container} className="relative h-20 flex-none bg-gray-100" data-player-state={loaded ? 'loaded' : started ? 'loading' : 'queued'}>
    {!loaded && <div className="absolute inset-0 flex items-center justify-between gap-3 px-5 text-sm text-gray-600">
      <span className="truncate">{title}</span>
      <a href={`https://open.spotify.com/track/${trackId}`} target="_blank" rel="noreferrer" className="shrink-0 underline">Spotify ↗</a>
    </div>}
    {started && <iframe
      src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
      width="100%" height="80" frameBorder={0}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="eager" title={title}
      className={`relative h-20 w-full transition-opacity ${loaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onLoad={() => { setLoaded(true); ticket.current?.complete(); }}
      onError={() => ticket.current?.complete()}
    />}
  </div>;
};
