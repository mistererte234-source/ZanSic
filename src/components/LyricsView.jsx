import { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';

export default function LyricsView() {
  const { currentTrack, currentTime, duration, lyrics } = usePlayer();
  const listRef = useRef(null);
  const [center, setCenter] = useState(0);

  const synced = lyrics?.synced || [];
  const plain = lyrics?.text || '';
  const isSynced = synced.length > 0;

  let idx = synced.findIndex((line, i) => {
    const t = line.time ?? 0;
    const next = synced[i + 1];
    const nextT = next ? (next.time ?? Infinity) : Infinity;
    return currentTime >= t && currentTime < nextT;
  });
  if (idx === -1 && synced.length) idx = currentTime < (synced[0].time ?? 0) ? 0 : synced.length - 1;

  const plainLines = plain.split('\n').filter(Boolean);
  let pIdx = -1;
  if (!isSynced && plainLines.length && duration > 0) {
    const p = Math.min(Math.max((currentTime - duration * 0.06) / (duration * 0.9), 0), 0.999);
    pIdx = Math.floor(p * plainLines.length);
  }
  const active = isSynced ? idx : pIdx;
  const lines = isSynced ? synced.map(l => l.text ?? '') : plainLines;

  // Geser list biar baris aktif PERSIS di tengah (tanpa scroll, tanpa padding)
  useEffect(() => {
    const list = listRef.current;
    if (!list || active < 0) return;
    const el = list.children[active];
    if (el) setCenter(el.offsetTop + el.offsetHeight / 2);
  }, [active, lines.length]);

  if (!currentTrack) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(120,119,198,0.15) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.85) 100%)' }} />

      {lines.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/40">Lirik tidak tersedia</p>
        </div>
      ) : (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-1/2 px-6 text-center transition-transform duration-700 ease-in-out will-change-transform"
          style={{ transform: `translateY(${-center}px)` }}
        >
          {lines.map((text, i) => {
            const isActive = i === active;
            const d = Math.abs(i - active);
            return (
              <p
                key={i}
                className={`transition-all duration-700 ease-out leading-snug my-3 ${isActive ? 'text-white font-semibold' : 'text-white/50'}`}
                style={{
                  fontSize: isActive ? 'clamp(1.5rem,4vw,2rem)' : 'clamp(1.125rem,3vw,1.375rem)',
                  opacity: isActive ? 1 : Math.max(0.15, 1 - d * 0.15),
                  transform: `scale(${isActive ? 1.05 : Math.max(0.9, 1 - d * 0.02)})`,
                  textShadow: isActive ? '0 0 30px rgba(255,255,255,0.4), 0 0 60px rgba(120,119,198,0.3)' : 'none',
                }}
              >
                {text}
              </p>
            );
          })}
        </div>
      )}

      <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] tracking-widest uppercase text-white/30">
        v15 · {isSynced ? 'synced' : plain ? 'plain' : 'none'}
      </div>
    </div>
  );
}
