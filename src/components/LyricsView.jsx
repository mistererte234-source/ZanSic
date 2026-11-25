import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

export default function LyricsView() {
  const { currentTrack, currentTime, lyrics } = usePlayer();
  const containerRef = useRef(null);
  const activeRef = useRef(null);

  // Support berbagai format lyrics
  const lines = Array.isArray(lyrics) ? lyrics : [];

  const activeIndex = lines.findIndex((line, i) => {
    const t = line.time ?? line.startTime ?? line.start ?? 0;
    const next = lines[i + 1];
    const nextT = next ? (next.time ?? next.startTime ?? next.start ?? Infinity) : Infinity;
    return currentTime >= t && currentTime < nextT;
  });

  useEffect(() => {
    if (activeIndex < 0 || !activeRef.current || !containerRef.current) return;

    const el = activeRef.current;
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeIndex]);

  if (!currentTrack) return null;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-zinc-900/80 to-black">
      <div className="pt-8 pb-4 text-center shrink-0">
        <p className="text-xs tracking-widest text-white/50 uppercase">Now Playing</p>
        <h2 className="text-lg font-semibold text-white mt-1">{currentTrack.title}</h2>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 pb-40"
      >
        <div className="max-w-md mx-auto space-y-7 py-24">
          {lines.length > 0 ? (
            lines.map((line, i) => {
              const isActive = i === activeIndex;
              const text = line.text ?? line.line ?? line.lyric ?? '';

              return (
                <p
                  key={i}
                  ref={isActive ? activeRef : null}
                  className={`
                    text-center transition-all duration-300 leading-snug
                    ${isActive
                      ? 'text-white text-2xl md:text-3xl font-bold'
                      : 'text-white/35 text-lg'
                    }
                  `}
                >
                  {text}
                </p>
              );
            })
          ) : (
            <p className="text-center text-white/40">Lirik tidak tersedia</p>
          )}
        </div>
      </div>
    </div>
  );
}
