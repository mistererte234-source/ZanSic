import React, { useState, useEffect } from 'react';
import { PlayerProvider } from './context/PlayerContext.jsx';
import { LibraryProvider } from './context/LibraryContext.jsx';
import { ZanTimeProvider } from './context/ZanTimeContext.jsx';
import AdzanToast from './components/AdzanToast.jsx';
import Sidebar from './components/Sidebar.jsx';
import BottomNav from './components/BottomNav.jsx';
import Navbar from './components/Navbar.jsx';
import PlayerBar from './components/PlayerBar.jsx';
import NowPlayingModal from './components/NowPlayingModal.jsx';
import ZandevFooter from './components/ZandevFooter.jsx';
import HomeView from './views/HomeView.jsx';
import SearchView from './views/SearchView.jsx';
import LibraryView from './views/LibraryView.jsx';

function MainApp() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'explore' | 'search' | 'radio' | 'library'
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchTrigger = (query = '') => {
    setSearchQuery(query);
    setActiveTab('search');
  };

  // ⌘K / Ctrl+K → buka pencarian
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleSearchTrigger('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#05070f] text-white flex flex-col justify-between overflow-x-clip">
      {/* Dynamic Background Mesh Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-25">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#FA2D48] blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-700 blur-[150px]" />
        <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-blue-600 blur-[180px]" />
      </div>

      <div className="relative z-10 flex flex-1">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <Navbar onOpenSearch={() => handleSearchTrigger('')} />

          <div className="flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
            {activeTab === 'home' && (
              <HomeView onSearchQuery={(q) => handleSearchTrigger(q)} />
            )}

            {activeTab === 'explore' && (
              <SearchView initialQuery="Top Trending Music 2026" />
            )}

            {activeTab === 'search' && (
              <SearchView initialQuery={searchQuery} />
            )}

            {activeTab === 'radio' && (
              <SearchView initialQuery="Lofi Chill & Acoustic Radio" />
            )}

            {activeTab === 'library' && (
              <LibraryView />
            )}

            {/* ZANDEV WATERMARK FOOTER (Link to https://zandev.id) */}
            <ZandevFooter />
          </div>
        </main>
      </div>

      {/* Floating Bottom Mini Player Bar */}
      <PlayerBar />

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Fullscreen iOS 18 Now Playing Modal */}
      <NowPlayingModal />

      {/* Notifikasi masuk waktu shalat */}
      <AdzanToast />
    </div>
  );
}

export default function App() {
  return (
    <ZanTimeProvider>
      <LibraryProvider>
        <PlayerProvider>
          <MainApp />
        </PlayerProvider>
      </LibraryProvider>
    </ZanTimeProvider>
  );
}
