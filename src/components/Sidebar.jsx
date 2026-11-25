import React from 'react';
import { Home, Search, Library, Heart, ListMusic, Compass, Radio } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import SidebarCalendar from './SidebarCalendar.jsx';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { playlists, favorites } = useLibrary();
  const { isPlaying } = usePlayer();

  const navItems = [
    { id: 'home', label: 'Listen Now', icon: Home },
    { id: 'explore', label: 'Browse & Charts', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'radio', label: 'Radio & Vibes', icon: Radio },
    { id: 'library', label: 'Library', icon: Library },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 overflow-y-auto bg-[#080b14]/60 backdrop-blur-3xl border-r border-white/[0.08] p-5 justify-between z-30 select-none">
      <div>
{/* Brand Header */}
<div className="flex items-center gap-3 px-3 py-2 mb-8">
  <img
    src="/logo-mark.png"
    alt="ZanSic"
    className="w-10 h-10 shrink-0 object-contain select-none drop-shadow-[0_0_14px_rgba(138,43,226,0.5)]"
  />
  <div>
    <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-1.5">
      <span className="flex">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D78] to-[#C026D3]">Zan</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2F6BFF] to-[#38BDF8]">Sic</span>
      </span>
      {isPlaying && (
        <span className="flex items-end gap-[2px] h-3 ml-1">
          <span className="w-0.5 h-full rounded-full bg-gradient-to-t from-[#FF2D78] to-[#C026D3] animate-pulse"></span>
          <span className="w-0.5 h-2 rounded-full bg-gradient-to-t from-[#8A2BE2] to-[#2F6BFF] animate-pulse [animation-delay:120ms]"></span>
          <span className="w-0.5 h-3.5 rounded-full bg-gradient-to-t from-[#2F6BFF] to-[#22C55E] animate-pulse [animation-delay:240ms]"></span>
        </span>
      )}
    </h1>
    <p className="text-[11px] font-medium text-zinc-400 tracking-wider uppercase">iOS Music Suite</p>
  </div>
</div>

        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Discover</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FA2D48] to-[#FA2D48]/80 text-white shadow-lg shadow-[#FA2D48]/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Library Submenu */}
        <div className="mt-8 space-y-1">
          <p className="px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">My Collection</p>
          
          <button
            onClick={() => setActiveTab('library')}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-pink-500" />
              <span>Favorites</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
              {favorites.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            <div className="flex items-center gap-3">
              <ListMusic className="w-4 h-4 text-cyan-400" />
              <span>Playlists</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
              {playlists.length}
            </span>
          </button>
        </div>

        <SidebarCalendar />
      </div>

      {/* Subtle Sidebar Watermark */}
      <div className="pt-4 border-t border-white/[0.08] px-2 text-center">
        <a
          href="https://zandev.id"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-zinc-400 hover:text-white transition-colors"
        >
          Developed for <span className="font-semibold text-zinc-300 underline decoration-[#FA2D48]">zandev.id</span>
        </a>
      </div>
    </aside>
  );
}
