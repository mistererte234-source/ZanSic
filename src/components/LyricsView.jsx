import React, { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../context/PlayerContext.jsx';

export default function LyricsView() {
  const { currentTrack, currentTime, duration } = usePlayer();
  const containerRef = useRef(null);
  const [lyrics, setLyrics] = useState({ synced: [], text: '', hasSynced: false });
  const [activeIndex, setActiveIndex] = useState(-1);
  const userScrolled = useRef(false);
  const scrollTimeout = useRef(null);

  // Fetch lyrics
  useEffect(() => {
    if (!currentTrack) return;
    setLyrics({ synced: [], text: '', hasSynced: false });
    setActiveIndex(-1);

    fetch(`/api/lyrics/${currentTrack.id}?title=${encodeURIComponent(currentTrack.title || '')}&artist=${encodeURIComponent(currentTrack.artist || '')}`)
      .then(r => r.json())
      .then(data => {
        let synced = data.synced || [];
        
        // Estimated sync for plain lyrics
        if (!synced.length && data.text && duration > 10) {
          const lines = data.text.split('\n').filter(l => l.trim());
          const lineDuration = duration / Math.max(lines.length, 1);
          synced = lines.map((text, i) => ({
            time: i * lineDuration,
            text: text.trim()
          }));
        }

        setLyrics({
          synced,
          text: data.text || '',
          hasSynced: !!data.synced?.length
        });
      })
      .catch(() => {});
  }, [currentTrack, duration]);

  // Find active line
  useEffect(() => {
    if (!lyrics.synced.length) return;
    
    let idx = lyrics.synced.findIndex((line, i) => {
      const next = lyrics.synced[i + 1];
      return currentTime >= line.time && (!next || currentTime < next.time);
    });
    
    if (idx === -1 && currentTime > 0) idx = 0;
    setActiveIndex(idx);
  }, [currentTime, lyrics.synced]);

  // Auto scroll
  useEffect(() => {
    if (activeIndex < 0 || !containerRef.current || userScrolled.current) return;
    
    const el = containerRef.current.children[activeIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  // Detect user scroll
  const handleScroll = () => {
    userScrolled.current = true;
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      userScrolled.current = false;
    }, 3000);
  };

  if (!lyrics.synced.length && !lyrics.text) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500">
        Lirik tidak tersedia
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto px-8 py-16 space-y-8 text-center scrollbar-thin scrollbar-thumb-zinc-700"
    >
      {lyrics.synced.map((line, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        
        return (
          <p
            key={i}
            className={`transition-all duration-500 ease-out ${
              isActive 
                ? 'text-white text-3xl font-bold scale-105' 
                : isPast
                ? 'text-zinc-600 text-xl'
                : 'text-zinc-500 text-xl'
            }`}
          >
            {line.text || '♪'}
          </p>
        );
      })}
      
      {!lyrics.hasSynced && lyrics.synced.length > 0 && (
        <p className="text-xs text-zinc-600 mt-12">
          Estimated timing
        </p>
      )}
    </div>
  );
}
