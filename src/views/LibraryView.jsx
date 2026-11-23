import React, { useState } from 'react';
import { Heart, ListMusic, History, Plus, Play, Trash2, Music } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';

export default function LibraryView() {
  const { favorites, history, playlists, createPlaylist, toggleFavorite } = useLibrary();
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' | 'playlists' | 'history'
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName);
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Library</h2>
          <p className="text-xs sm:text-sm text-zinc-400">All your saved vibes, playlists, and listening history</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-card border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'favorites' ? 'bg-[#FA2D48] text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>Favorites ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'playlists' ? 'bg-[#FA2D48] text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            <span>Playlists ({playlists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'history' ? 'bg-[#FA2D48] text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* 1. FAVORITES TAB */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400 gap-3">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Heart className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-bold text-white">No favorites yet</h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm">
                Tap the heart icon on any song while listening or searching to add it to your collection!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favorites.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, favorites, idx)}
                    className={`group flex items-center justify-between p-3 rounded-2xl glass-card transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                      isCurrent ? 'border-[#FA2D48]/50 bg-[#FA2D48]/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                        <img
                          src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop'}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${
                          isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-[#FA2D48]' : 'text-white'}`}>
                          {track.title}
                        </h4>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track);
                      }}
                      className="p-2 text-pink-500 hover:text-pink-400 transition-colors"
                      title="Remove from favorites"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. PLAYLISTS TAB */}
      {activeTab === 'playlists' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FA2D48] to-rose-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#FA2D48]/20 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Playlist</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="p-4 rounded-2xl glass-card transition-all duration-200 hover:-translate-y-1 group"
              >
                <div className="aspect-square rounded-xl bg-gradient-to-br from-indigo-900 to-purple-900 mb-3 flex items-center justify-center shadow-inner">
                  <ListMusic className="w-10 h-10 text-white/50 group-hover:text-white group-hover:scale-110 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-white truncate">{pl.name}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">{pl.songs.length} songs</p>
              </div>
            ))}
          </div>

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <div className="w-full max-w-sm rounded-3xl glass-dock border border-white/15 p-6 space-y-4 shadow-2xl">
                <h3 className="text-lg font-bold text-white">Create New Playlist</h3>
                <form onSubmit={handleCreatePlaylist} className="space-y-4">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Playlist name..."
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-zinc-400 focus:outline-none focus:border-[#FA2D48]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#FA2D48] text-white text-xs font-bold shadow-md hover:bg-rose-500"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. HISTORY TAB */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400 gap-3">
              <History className="w-12 h-12 text-zinc-600" />
              <h3 className="text-lg font-bold text-white">No listening history yet</h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                Songs you play will automatically appear here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={`${track.id}_${idx}`}
                    onClick={() => playTrack(track, history, idx)}
                    className={`group flex items-center justify-between p-3 rounded-2xl glass-card transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                      isCurrent ? 'border-[#FA2D48]/50 bg-[#FA2D48]/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                        <img
                          src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop'}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${
                          isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-[#FA2D48]' : 'text-white'}`}>
                          {track.title}
                        </h4>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <span className="text-xs text-zinc-400 ml-2 font-mono">
                      {track.duration || '3:30'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
