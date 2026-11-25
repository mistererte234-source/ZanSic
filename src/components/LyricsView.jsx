import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

export default function LyricsView() {
  const { currentTrack, currentTime, lyrics } = usePlayer();
  const containerRef = useRef(null);
  const activeRef = useRef(null);

  // Cari index baris yang sedang aktif
  const activeIndex = lyrics?.findIndex((line, i) => {
    const next = lyrics[i + 1];
    return currentTime >= line.time && (!next || currentTime < next.time);
  }) ?? -1;

  // Auto-scroll ke baris aktif
  useEffect(() => {
    if (activeIndex < 0 || !activeRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const active = activeRef.current;

    const containerHeight = container.clientHeight;
    const activeTop = active.offsetTop;
    const activeHeight = active.clientHeight;

    // Scroll supaya baris aktif di tengah
    const targetScroll = activeTop - containerHeight / 2 + activeHeight / 2;

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth',
    });
  }, [activeIndex]);

  if (!currentTrack) return null;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-zinc-900/80 to-black">
      {/* Header */}
      <div className="pt-8 pb-4 text-center shrink-0">
        <p className="text-xs tracking-widest text-white/50 uppercase">Now Playing</p>
        <h2 className="text-lg font-semibold text-white mt-1">{currentTrack.title}</h2>
      </div>

      {/* Lyrics container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-md mx-auto space-y-6 py-20">
          {lyrics && lyrics.length > 0 ? (
            lyrics.map((line, i) => {
              const isActive = i === activeIndex;
              const isPast = i < activeIndex;

              return (
                <p
                  key={i}
                  ref={isActive ? activeRef : null}
                  className={`
                    text-center transition-all duration-300 leading-relaxed
                    ${isActive 
                      ? 'text-white text-2xl md:text-3xl font-semibold scale-105' 
                      : isPast 
                        ? 'text-white/30 text-lg' 
                        : 'text-white/40 text-lg'
                    }
                  `}
                >
                  {line.text}
                </p>
              );
            })
          ) : (
            <p className="text-center text-white/40 text-lg">Lirik tidak tersedia</p>
          )}
        </div>
      </div>
    </div>
  );
}
