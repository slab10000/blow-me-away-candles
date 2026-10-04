import React, { useEffect, useRef, useState } from 'react';

export default function SpotifyPreview({ trackId, title }: { trackId: string; title: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '150px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} className="h-20 flex-none bg-gray-100">
    {visible ? <iframe
      src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
      width="100%" height="80" frameBorder={0}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy" title={title}
    /> : <div className="h-full flex items-center px-5 text-sm text-gray-500">{title}</div>}
  </div>;
}
