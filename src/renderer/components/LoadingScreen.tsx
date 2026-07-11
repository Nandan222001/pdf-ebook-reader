// src/renderer/components/LoadingScreen.tsx
// Elegant loading screen shown during app initialization

import { BookOpen } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-book-bg animate-fade-in">
      <div className="relative">
        <BookOpen
          className="w-16 h-16 text-book-accent animate-pulse"
          strokeWidth={1.5}
        />
        <div className="absolute inset-0 blur-xl bg-book-accent/30 rounded-full" />
      </div>
      <p className="mt-6 text-book-muted font-serif text-lg tracking-wide">
        Loading your library...
      </p>
      <div className="mt-4 w-32 h-1 bg-book-border rounded-full overflow-hidden">
        <div className="h-full bg-book-accent rounded-full animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  );
}
