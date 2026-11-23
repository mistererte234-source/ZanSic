import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Flame, Radio, Music, Disc3, TrendingUp } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import PrayerWidget from '../components/PrayerWidget.jsx';

export default function HomeView({ onSearchQuery }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/explore')
      .then(res => res.json())
      .then(data => {
        if (data.sections && data.sections.length > 0) {
          setSections(data.sections);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load explore:', err);
        setLoading(false);
      });
  }, []);

  // Quick categories
  const moodChips = [
    { label: 'Indo Pop Hits', query: 'Indonesian Pop Hits' },
    { label: 'Chill Lofi', query: 'Lofi Hip Hop Chill' },
    { label: 'Workout Energy', query: 'Workout Motivation Music' },
    { label: 'Focus & Study', query: 'Deep Focus Ambient Piano' },
    { label: 'Late Night R&B', query: 'Late Night R&B Soul' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Hero Glass Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-[#FA2D48]/30 via-purple-600/20 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FA2D48]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated For You</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Music without limits. Pure iOS Flow.
          </h2>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Streaming lossless ad-free sound powered by InnerTube engine with Apple Music iOS 18 glass aesthetic.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSearchQuery('Top Hits Indonesia 2026')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FA2D48] to-rose-600 hover:from-rose-500 hover:to-[#FA2D48] text-white text-sm font-bold shadow-lg shadow-[#FA2D48]/30 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play Top Indonesian Hits</span>
            </button>

            <button
              onClick={() => onSearchQuery('Global Top 50')}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/10 transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Global Billboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Waktu Shalat + Kalender Masehi / Hijriah / Jawa */}
      <PrayerWidget />

      {/* Mood & Vibe Chips */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">Vibe & Quick Mixes</h3>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {moodChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSearchQuery(chip.query)}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-all transform hover:scale-105 active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Sections from InnerTube */}
      {loading ? (
        <div className="space-y-6">
          <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-[#FA2D48]" />
                <span>{section.title}</span>
              </h3>
              <button
                onClick={() => onSearchQuery(section.title)}
                className="text-xs font-semibold text-[#FA2D48] hover:underline"
              >
                See all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
              {section.items.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, section.items)}
                    className="group relative p-3 rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shadow-lg hover:shadow-2xl"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-white/5">
                      <img
                        src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop'}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                        isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <div className="w-12 h-12 rounded-full bg-[#FA2D48] text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                          <Play className="w-5 h-5 fill-white translate-x-0.5" />
                        </div>
                      </div>
                    </div>

                    <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-[#FA2D48]' : 'text-white'}`}>
                      {track.title}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
