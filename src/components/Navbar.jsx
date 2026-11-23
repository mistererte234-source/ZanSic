import React from 'react';
import { Search, Volume2, ShieldCheck } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import TimePill from './TimePill.jsx';

export default function Navbar({ onOpenSearch }) {
  const { isPlaying, currentTrack } = usePlayer();

  return (
    <header className="sticky top-0 z-20 w-full px-4 md:px-8 py-3.5 bg-[#05070f]/70 backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between">
      {/* Quick Search Bar */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-zinc-400 hover:text-white transition-all text-xs sm:text-sm text-left group shadow-inner"
        >
          <Search className="w-4 h-4 flex-shrink-0 text-zinc-400 group-hover:text-white transition-colors" />
          <span className="truncate"><span className="sm:hidden">Cari lagu...</span><span className="hidden sm:inline">Search artists, songs, lyrics, or albums...</span></span>
          <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] bg-white/10 rounded text-zinc-400 font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 ml-4">
        {isPlaying && currentTrack && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FA2D48]/10 border border-[#FA2D48]/20 text-[#FA2D48] text-xs font-semibold">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span className="truncate max-w-[140px]">{currentTrack.title}</span>
          </div>
        )}

        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ad-Free</span>
        </div>

        <TimePill />
      </div>
    </header>
  );
}
