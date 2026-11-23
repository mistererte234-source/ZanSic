import React, { createContext, useContext, useState, useEffect } from 'react';

const LibraryContext = createContext();

export function LibraryProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('zansic_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('zansic_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem('zansic_playlists');
      return saved ? JSON.parse(saved) : [
        { id: 'fav_pl', name: 'My Top Vibe', songs: [] }
      ];
    } catch {
      return [{ id: 'fav_pl', name: 'My Top Vibe', songs: [] }];
    }
  });

  useEffect(() => {
    localStorage.setItem('zansic_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('zansic_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('zansic_playlists', JSON.stringify(playlists));
  }, [playlists]);

  const toggleFavorite = (track) => {
    if (!track || !track.id) return;
    setFavorites(prev => {
      const exists = prev.some(item => item.id === track.id);
      if (exists) {
        return prev.filter(item => item.id !== track.id);
      } else {
        return [track, ...prev];
      }
    });
  };

  const isFavorite = (trackId) => {
    return favorites.some(item => item.id === trackId);
  };

  const addToHistory = (track) => {
    if (!track || !track.id) return;
    setHistory(prev => {
      const filtered = prev.filter(item => item.id !== track.id);
      return [track, ...filtered].slice(0, 50); // limit 50
    });
  };

  const createPlaylist = (name) => {
    if (!name.trim()) return;
    const newPl = {
      id: 'pl_' + Date.now(),
      name: name.trim(),
      songs: []
    };
    setPlaylists(prev => [...prev, newPl]);
  };

  const addSongToPlaylist = (playlistId, track) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        if (pl.songs.some(s => s.id === track.id)) return pl;
        return { ...pl, songs: [...pl.songs, track] };
      }
      return pl;
    }));
  };

  const removeSongFromPlaylist = (playlistId, trackId) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, songs: pl.songs.filter(s => s.id !== trackId) };
      }
      return pl;
    }));
  };

  return (
    <LibraryContext.Provider value={{
      favorites,
      toggleFavorite,
      isFavorite,
      history,
      addToHistory,
      playlists,
      createPlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export const useLibrary = () => useContext(LibraryContext);
