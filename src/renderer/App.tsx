// src/renderer/App.tsx
// Root App component — handles initial data loading and view routing

import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import LibraryView from './views/LibraryView';
import ReaderView from './views/ReaderView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';
import Sidebar from './components/Sidebar';
import LoadingScreen from './components/LoadingScreen';

export type ViewName = 'library' | 'reader' | 'stats' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewName>('library');
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    profile, setProfile, setBooks, setStats,
    currentBook, isReading, setIsReading,
    theme,
  } = useStore();

  // Initialize: load profile, books, and stats from DB
  useEffect(() => {
    async function init() {
      try {
        // Load user profile
        const userProfile = await window.electronAPI.profile.get();
        setProfile(userProfile);

        // Apply theme
        document.documentElement.className = userProfile.preferences.theme;

        // Load library
        const books = await window.electronAPI.library.getAll();
        setBooks(books);

        // Load stats
        const stats = await window.electronAPI.stats.get();
        setStats(stats);

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    }
    init();
  }, []);

  // Handle navigation to reader when a book is opened
  useEffect(() => {
    if (isReading && currentBook) {
      setCurrentView('reader');
    }
  }, [isReading, currentBook]);

  // Apply theme whenever it changes
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-book-bg">
      {/* Sidebar — hidden in reader mode for immersive reading */}
      {currentView !== 'reader' && <Sidebar currentView={currentView} onNavigate={setCurrentView} />}

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'library' && <LibraryView />}
        {currentView === 'reader' && (
          <ReaderView onExit={() => {
            setIsReading(false);
            setCurrentView('library');
          }} />
        )}
        {currentView === 'stats' && <StatsView />}
        {currentView === 'settings' && <SettingsView />}
      </div>
    </div>
  );
}
