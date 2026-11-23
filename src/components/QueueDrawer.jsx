import React from 'react';
import { Play, Trash2, Music2, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';

export default function QueueDrawer() {
  const { queue, queueIndex, playTrack, removeFromQueue, currentTrack } = usePlayer();

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Playing Next</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
              {queue.length}
            </span>
          </h3>
          <p className="text-xs text-zinc-400">Autoplay queue & recommendations</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-400 text-center gap-2">
            <Music2 className="w-8 h-8 text-zinc-600" />
            <p className="text-sm">Queue is empty</p>
            <p className="text-xs text-zinc-400">Play a track to start your queue!</p>
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id || idx === queueIndex;
            return (
              <div
                key={`${track.id}_${idx}`}
                className={`group flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 ${
                  isCurrent
                    ? 'bg-[#FA2D48]/15 border border-[#FA2D48]/30 text-white'
                    : 'hover:bg-white/[0.06] text-zinc-300'
                }`}
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => playTrack(track, queue, idx)}
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                    <img
                      src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop'}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[#FA2D48] animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5 className={`text-xs sm:text-sm font-semibold truncate ${isCurrent ? 'text-[#FA2D48]' : 'text-white'}`}>
                      {track.title}
                    </h5>
                    <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2">
                  <span className="text-[11px] text-zinc-400 hidden sm:inline">
                    {track.duration || '3:30'}
                  </span>
                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-all"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
