import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useLibrary } from './LibraryContext.jsx';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const { addToHistory } = useLibrary();

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('art');
  const [lyrics, setLyrics] = useState({ hasLyrics: false, text: '', synced: [] });

  const audioRef = useRef(new Audio());
  const durationRef = useRef(0);

  // ===== FETCH LYRICS (nunggu duration siap, max 3 detik) =====
  useEffect(() => {
    if (!currentTrack?.id) { setLyrics({ hasLyrics: false, text: '', synced: [] }); return; }
    let cancelled = false;
    setLyrics({ hasLyrics: false, text: '', synced: [] });

    const waitDuration = () => new Promise(res => {
      if (durationRef.current > 0) return res();
      let t = 0;
      const iv = setInterval(() => {
        if (durationRef.current > 0 || t >= 30) { clearInterval(iv); res(); }
        t++;
      }, 100);
    });

    waitDuration().then(() => {
      if (cancelled) return;
      const p = new URLSearchParams({
        title: currentTrack.title || '',
        artist: currentTrack.artist || '',
        album: currentTrack.album || '',
        duration: String(durationRef.current || 0),
      });
      fetch(`/api/lyrics/${encodeURIComponent(currentTrack.id)}?${p}`)
        .then(r => r.json())
        .then(d => { if (!cancelled) setLyrics(d); })
        .catch(() => { if (!cancelled) setLyrics({ hasLyrics: false, text: '', synced: [] }); });
    });

    return () => { cancelled = true; };
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.preload = 'auto';
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => { durationRef.current = audio.duration || 0; setDuration(audio.duration || 0); setIsLoading(false); };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => { setIsLoading(false); setIsPlaying(true); };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => { if (isLooping) { audio.currentTime = 0; audio.play().catch(console.error); } else { skipNext(); } };
    const handleError = (e) => { console.error('[Audio Error]', e); setIsLoading(false); setIsPlaying(false); };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [isLooping, queue, queueIndex, isShuffle]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume; }, [volume, isMuted]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: currentTrack.title || 'Unknown Title',
          artist: currentTrack.artist || 'Unknown Artist',
          album: currentTrack.album || 'ZanSic',
          artwork: [{ src: currentTrack.thumbnail || '', sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', () => togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => skipPrev());
        navigator.mediaSession.setActionHandler('nexttrack', () => skipNext());
        navigator.mediaSession.setActionHandler('seekto', (d) => { if (d.seekTime !== undefined) seek(d.seekTime); });
      } catch {}
    }
  }, [currentTrack, queue, queueIndex]);

  const playTrack = (track, newQueue = null, index = null) => {
    if (!track || !track.id) return;
    if (newQueue) { setQueue(newQueue); setQueueIndex(index !== null ? index : newQueue.findIndex(t => t.id === track.id)); }
    else if (!queue.some(t => t.id === track.id)) { setQueue(prev => [...prev, track]); setQueueIndex(queue.length); }
    setCurrentTrack(track); addToHistory(track); setIsLoading(true); setCurrentTime(0); durationRef.current = 0;
    const audio = audioRef.current;
    audio.src = `/api/stream/${encodeURIComponent(track.id)}`;
    audio.load();
    audio.play().then(() => { setIsPlaying(true); setIsLoading(false); }).catch(err => { console.warn('Playback error:', err); setIsLoading(false); });
    fetch(`/api/song/${encodeURIComponent(track.id)}`).then(r => r.json()).then(data => {
      if (data.upNext && data.upNext.length > 0) setQueue(prev => { const ex = new Set(prev.map(p => p.id)); return [...prev, ...data.upNext.filter(i => !ex.has(i.id))]; });
    }).catch(() => {});
  };

  const togglePlay = () => { const a = audioRef.current; if (!currentTrack) return; a.paused ? a.play().catch(console.error) : a.pause(); };
  const seek = (t) => { if (audioRef.current) { audioRef.current.currentTime = t; setCurrentTime(t); } };
  const skipNext = () => { if (!queue.length) return; let n = isShuffle ? Math.floor(Math.random() * queue.length) : (queueIndex + 1) % queue.length; const nt = queue[n]; if (nt) { setQueueIndex(n); playTrack(nt, queue, n); } };
  const skipPrev = () => { if (currentTime > 3) { seek(0); return; } if (!queue.length) return; let p = queueIndex - 1; if (p < 0) p = queue.length - 1; const pt = queue[p]; if (pt) { setQueueIndex(p); playTrack(pt, queue, p); } };
  const addToQueue = (track) => { if (track) setQueue(prev => [...prev, track]); };
  const removeFromQueue = (index) => { setQueue(prev => prev.filter((_, i) => i !== index)); if (index === queueIndex) skipNext(); else if (index < queueIndex) setQueueIndex(prev => prev - 1); };

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, currentTime, duration, volume, setVolume, isMuted, setIsMuted,
      isLooping, setIsLooping, isShuffle, setIsShuffle, queue, queueIndex, isLoading,
      isModalOpen, setIsModalOpen, modalTab, setModalTab, lyrics,
      playTrack, togglePlay, seek, skipNext, skipPrev, addToQueue, removeFromQueue, audioRef
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
