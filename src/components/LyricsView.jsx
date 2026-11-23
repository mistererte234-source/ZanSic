import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext.jsx';

export default function LyricsView() {
  const { currentTrack, currentTime } = usePlayer();
  const containerRef = useRef(null);
  const [lyrics, setLyrics] = React.useState({ synced: [], text: '' });

  useEffect(() => {
    if (!currentTrack) return;
    fetch(`/api/lyrics/${currentTrack.id}?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`)
      .then(r => r.json())
      .then(setLyrics)
      .catch(() => {});
  }, [currentTrack]);

  useEffect(() => {
    if (!lyrics.synced.length) return;
    const active = lyrics.synced.findIndex((line, i) => {
      const next = lyrics.synced[i + 1];
      return currentTime >= line.time && (!next || currentTime < next.time);
    });
    if (active >= 0 && containerRef.current) {
      const el = containerRef.current.children[active];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime, lyrics.synced]);

  if (!lyrics.synced.length && !lyrics.text) {
    return <div className="text-center text-zinc-500 py-20">Lirik tidak tersedia</div>;
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-6 py-8 space-y-6 text-center">
      {lyrics.synced.length > 0 ? (
        lyrics.synced.map((line, i) => {
          const isActive = currentTime >= line.time && (i === lyrics.synced.length - 1 || currentTime < lyrics.synced[i + 1].time);
          return (
            <p
              key={i}
              className={`text-2xl font-semibold transition-all duration-300 ${
                isActive ? 'text-white scale-105' : 'text-zinc-500'
              }`}
            >
              {line.text}
            </p>
          );
        })
      ) : (
        <p className="text-zinc-400 whitespace-pre-line leading-relaxed">{lyrics.text}</p>
      )}
    </div>
  );
}