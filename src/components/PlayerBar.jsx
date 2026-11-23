import React, { useState } from 'react';
import { Play, Pause, SkipForward, Heart, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useLibrary } from '../context/LibraryContext.jsx';

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    skipNext,
    currentTime,
    duration,
    setIsModalOpen,
    volume,
    setVolume,
    isMuted,
    setIsMuted
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();
  const [hoverVol, setHoverVol] = useState(false);

  if (!currentTrack) return null;

  const fav = isFavorite(currentTrack.id);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const vol = isMuted ? 0 : volume;

  return (
    <div className="fixed bottom-16 md:bottom-6 left-3 right-3 sm:left-6 sm:right-6 md:left-72 md:right-8 z-40">
      {/* Tanpa overflow-hidden di sini, supaya popup volume di atas bar tidak terpotong */}
      <div className="relative rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
        {/* Garis progres: dipotong sendiri agar tetap mengikuti sudut melengkung */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/10 rounded-t-3xl overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center justify-between p-3 gap-3">
          <div onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
            <img
              src={currentTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
              alt=""
              className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{currentTrack.title}</div>
              <div className="text-xs text-zinc-400 truncate">{currentTrack.artist}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => toggleFavorite(currentTrack)} className="p-2 text-zinc-400 hover:text-white">
              <Heart className={`w-4 h-4 ${fav ? 'fill-pink-500 text-pink-500' : ''}`} />
            </button>

            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black translate-x-0.5" />}
            </button>

            <button onClick={skipNext} className="p-2 text-zinc-300 hover:text-white">
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume: hanya di layar sm ke atas; di HP pakai tombol volume fisik */}
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setHoverVol(true)}
              onMouseLeave={() => setHoverVol(false)}
            >
              <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-zinc-400 hover:text-white">
                {vol === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {hoverVol && (
                // bottom-full: menempel tepat di atas tombol; pb-3 mengisi celah agar hover tidak putus
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3">
                  <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 shadow-xl">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={vol}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setVolume(v);
                        setIsMuted(v === 0);
                      }}
                      className="w-24 accent-white"
                    />
                    <div className="text-center text-[10px] text-zinc-400 mt-1">{Math.round(vol * 100)}%</div>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setIsModalOpen(true)} className="hidden sm:block p-2 text-zinc-400 hover:text-white">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
