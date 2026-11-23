import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Play, Clock, Sparkles, Filter, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useLibrary } from '../context/LibraryContext.jsx';

export default function SearchView({ initialQuery = '' }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { toggleFavorite, isFavorite } = useLibrary();

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/suggestions?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.suggestions) setSuggestions(data.suggestions.slice(0, 6));
        })
        .catch(() => {});
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setShowSuggestions(false);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      performSearch(query);
    }
  };

  const genres = [
    { name: 'Pop Hits', color: 'from-pink-500 to-rose-600', q: 'Pop Hits' },
    { name: 'Hip Hop', color: 'from-amber-500 to-orange-600', q: 'Hip Hop Rap' },
    { name: 'Indie & Folk', color: 'from-emerald-500 to-teal-700', q: 'Indie Folk Indonesia' },
    { name: 'Rock & Alternative', color: 'from-red-600 to-purple-800', q: 'Rock Alternative' },
    { name: 'Electronic / EDM', color: 'from-cyan-500 to-blue-600', q: 'EDM Electronic Dance' },
    { name: 'K-Pop Universe', color: 'from-purple-500 to-pink-600', q: 'K-Pop Top Hits' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Search Bar Input */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search artists, songs, lyrics, or playlists..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl glass-panel border border-white/15 focus:border-[#FA2D48] bg-white/[0.06] text-white text-sm sm:text-base placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FA2D48]/30 transition-all shadow-xl"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="absolute right-4 p-1 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Auto-Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl glass-dock border border-white/15 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(item);
                  performSearch(item);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-white/10 text-xs sm:text-sm text-zinc-200 hover:text-white flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
              >
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <span className="truncate">{item}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
          <div className="w-9 h-9 border-2 border-[#FA2D48] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase text-zinc-400">Searching InnerTube...</p>
        </div>
      )}

      {/* Results List */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FA2D48]" />
              <span>Results for "{query}"</span>
            </h3>
            <span className="text-xs text-zinc-400">{results.length} songs found</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, results, idx)}
                  className={`group flex items-center justify-between p-3 rounded-2xl glass-card transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                    isCurrent ? 'border-[#FA2D48]/50 bg-[#FA2D48]/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 shadow">
                      <img
                        src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop'}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
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

                  <span className="text-xs text-zinc-400 ml-3 font-mono">
                    {track.duration || '3:30'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Default Browse Categories when no search */}
      {!loading && results.length === 0 && (
        <div className="space-y-6 pt-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Browse Categories & Moods</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {genres.map((g, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setQuery(g.q);
                  performSearch(g.q);
                }}
                className={`relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br ${g.color} cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className="relative z-10">
                  <h4 className="text-base sm:text-lg font-black text-white">{g.name}</h4>
                  <p className="text-xs text-white/80 mt-1">Explore stations</p>
                </div>
                <Music2 className="absolute -bottom-2 -right-2 w-16 h-16 text-white/20 transform rotate-12 group-hover:scale-110 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
