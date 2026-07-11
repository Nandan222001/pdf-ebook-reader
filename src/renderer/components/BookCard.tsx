// src/renderer/components/BookCard.tsx
// Individual book card for the library grid/shelf view

import { useState, useRef } from 'react';
import { BookMarked, MoreVertical, Trash2, Heart, BookOpen } from 'lucide-react';
import { cn, formatRelativeTime, generateCoverGradient, getInitials } from '../lib/utils';
import { useStore } from '../store/useStore';
import type { Book } from '../../shared/types';

interface BookCardProps {
  book: Book;
  onOpen: (book: Book) => void;
}

export default function BookCard({ book, onOpen }: BookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { updateBook, removeBook } = useStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI.library.toggleFavorite(book.id).then((updated: Book | null) => {
      if (updated) updateBook(book.id, updated);
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${book.title}" from your library?`)) {
      window.electronAPI.library.delete(book.id);
      removeBook(book.id);
    }
    setShowMenu(false);
  };

  const gradient = generateCoverGradient(book.title);
  const initials = getInitials(book.title);

  return (
    <div
      className="group relative cursor-pointer animate-slide-up"
      onClick={() => onOpen(book)}
    >
      {/* Book Cover */}
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg book-spine">
        {book.cover_thumbnail ? (
          <img
            src={book.cover_thumbnail}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br flex flex-col items-center justify-center p-4', gradient)}>
            <span className="text-4xl font-display font-bold text-white/90 mb-2">
              {initials}
            </span>
            <span className="text-xs text-white/70 text-center font-serif line-clamp-3">
              {book.title}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-sm font-medium">Open Book</span>
          </div>
        </div>

        {/* Favorite badge */}
        {book.is_favorite && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-book-accent/90 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
        )}

        {/* Cover overlay gradient for depth */}
        <div className="absolute inset-0 book-cover-overlay pointer-events-none" />
      </div>

      {/* Book Info */}
      <div className="mt-3 px-1">
        <h3 className="font-serif text-sm font-medium text-book-text line-clamp-1">
          {book.title}
        </h3>
        <p className="text-xs text-book-muted mt-0.5 line-clamp-1">
          {book.author || 'Unknown Author'}
        </p>

        {/* Progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(book.progress, 100)}%` }}
            />
          </div>
          <span className="text-xs text-book-muted tabular-nums">
            {Math.round(book.progress)}%
          </span>
        </div>

        <p className="text-xs text-book-muted mt-1">
          {formatRelativeTime(book.last_opened)}
        </p>
      </div>

      {/* Context menu */}
      <div className="absolute top-2 left-2" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-white" />
        </button>

        {showMenu && (
          <div className="absolute top-8 left-0 z-50 w-40 card shadow-xl py-1 animate-slide-up">
            <button
              onClick={handleToggleFavorite}
              className="w-full px-3 py-2 text-left text-sm hover:bg-book-border/50 flex items-center gap-2 text-book-text"
            >
              <Heart className={cn('w-4 h-4', book.is_favorite && 'fill-book-accent text-book-accent')} />
              {book.is_favorite ? 'Unfavorite' : 'Favorite'}
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/10 flex items-center gap-2 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
