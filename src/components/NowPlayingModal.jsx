import React, { useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Heart, Repeat, Shuffle, ChevronDown } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useLibrary } from '../context/LibraryContext.jsx';
import LyricsView from './LyricsView.jsx';

export default function NowPlayingModal() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    skipNext,
    skipPrev,
    currentTime,
    duration,
    seek,
    isLooping,
    setIsLooping,
    isShuffle,
    setIsShuffle,
    isModalOpen,
    setIsModalOpen,
    modalTab,
    setModalTab
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();

  if (!isModalOpen || !currentTrack) return null;

  const fav = isFavorite(currentTrack.id);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-3xl flex flex-col">
      {/* Blur Background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${currentTrack.thumbnail})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px)',
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-6 pt-12 pb-4">
        <button onClick={() => setIsModalOpen(false)} className="p-2 text-white/70 hover:text-white">
          <ChevronDown className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-xs text-white/50 uppercase tracking-widest">Now Playing</p>
          <p className="text-sm font-medium text-white truncate max-w-[200px]">{currentTrack.album || 'ZanSic'}</p>
        </div>
        <button onClick={() => toggleFavorite(currentTrack)} className="p-2">
          <Heart className={`w-5 h-5 ${fav ? 'fill-pink-500 text-pink-500' : 'text-white/70'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        {modalTab === 'lyrics' ? (
          <div className="w-full h-full max-w-lg">
            <LyricsView />
          </div>
        ) : (
          <>
            {/* Album Art */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl mb-8">
              <img
                src={currentTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">{currentTrack.title}</h1>
              <p className="text-lg text-white/60">{currentTrack.artist}</p>
            </div>
          </>
        )}
      </div>

      {/* Progress */}
      <div className="relative px-8 mb-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between text-xs text-white/50 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="relative flex items-center justify-center gap-8 pb-10">
        <button onClick={() => setIsShuffle(!isShuffle)} className={`p-3 ${isShuffle ? 'text-pink-500' : 'text-white/60'}`}>
          <Shuffle className="w-5 h-5" />
        </button>

        <button onClick={skipPrev} className="p-3 text-white">
          <SkipBack className="w-7 h-7 fill-white" />
        </button>

        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95"
        >
          {isPlaying ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black translate-x-0.5" />}
        </button>

        <button onClick={skipNext} className="p-3 text-white">
          <SkipForward className="w-7 h-7 fill-white" />
        </button>

        <button onClick={() => setIsLooping(!isLooping)} className={`p-3 ${isLooping ? 'text-pink-500' : 'text-white/60'}`}>
          <Repeat className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Switch */}
      <div className="relative flex justify-center gap-6 pb-8 text-sm">
        <button
          onClick={() => setModalTab('art')}
          className={`pb-1 border-b-2 ${modalTab === 'art' ? 'border-white text-white' : 'border-transparent text-white/40'}`}
        >
          Playing
        </button>
        <button
          onClick={() => setModalTab('lyrics')}
          className={`pb-1 border-b-2 ${modalTab === 'lyrics' ? 'border-white text-white' : 'border-transparent text-white/40'}`}
        >
          Lyrics
        </button>
      </div>
    </div>
  );
}