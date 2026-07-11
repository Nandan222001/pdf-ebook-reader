// src/renderer/views/LibraryView.tsx
// Library/home screen — grid/shelf view of all books with search and filters

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Upload, Library, Clock, Heart, Grid3x3 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import BookCard from '../components/BookCard';
import type { Book } from '../../shared/types';

export default function LibraryView() {
  const {
    books, searchQuery, setSearchQuery, filterMode, setFilterMode,
    addBook, updateBook, setCurrentBook, setIsReading, setCurrentPage,
  } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Filtered and sorted books
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.author?.toLowerCase().includes(q) ?? false)
      );
    }

    // Mode filter
    switch (filterMode) {
      case 'recent':
        result = result
          .filter((b) => b.last_opened !== null)
          .sort((a, b) => new Date(b.last_opened!).getTime() - new Date(a.last_opened!).getTime());
        break;
      case 'favorites':
        result = result.filter((b) => b.is_favorite);
        break;
      default:
        result = result.sort(
          (a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
        );
    }

    return result;
  }, [books, searchQuery, filterMode]);

  // Handle opening a book
  const handleOpenBook = useCallback(async (book: Book) => {
    setCurrentBook(book);
    setCurrentPage(book.last_read_page || 1);
    setIsReading(true);

    // Update last_opened timestamp
    const updated = { ...book, last_opened: new Date().toISOString() };
    window.electronAPI.library.update(book.id, { last_opened: updated.last_opened });
    updateBook(book.id, { last_opened: updated.last_opened });
  }, [setCurrentBook, setCurrentPage, setIsReading, updateBook]);

  // Handle PDF file import
  const handleImportFiles = useCallback(async (filePaths: string[]) => {
    setIsImporting(true);
    for (const filePath of filePaths) {
      try {
        // Extract title from filename
        const fileName = filePath.split(/[\\/]/).pop() || 'Untitled';
        const title = fileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');

        // Get file stats
        const fileStats = await window.electronAPI.pdf.open(filePath);

        // Add to database
        const book = await window.electronAPI.library.add({
          title,
          author: null,
          file_path: filePath,
          file_size: fileStats.fileSize,
          page_count: 0, // Will be updated when the PDF is loaded
          cover_thumbnail: null, // Will be generated when first page renders
        });

        addBook(book);
      } catch (error) {
        console.error(`Failed to import ${filePath}:`, error);
      }
    }
    setIsImporting(false);
  }, [addBook]);

  // File picker button
  const handleSelectFiles = useCallback(async () => {
    const filePaths = await window.electronAPI.file.selectPdf();
    if (filePaths && filePaths.length > 0) {
      await handleImportFiles(filePaths);
    }
  }, [handleImportFiles]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter((f) => f.name.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length > 0) {
      // In Electron, we need the file paths — use the path property
      const paths = pdfFiles.map((f) => (f as any).path).filter(Boolean);
      if (paths.length > 0) {
        handleImportFiles(paths);
      }
    }
  };

  const filterTabs = [
    { id: 'all' as const, label: 'All Books', icon: Library },
    { id: 'recent' as const, label: 'Recently Read', icon: Clock },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart },
  ];

  return (
    <div
      className="h-full flex flex-col bg-book-bg"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-book-accent/20 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="card p-12 text-center">
            <Upload className="w-16 h-16 text-book-accent mx-auto mb-4" />
            <p className="font-display text-2xl text-book-text">Drop your PDFs here</p>
            <p className="text-book-muted mt-2">They'll be added to your library</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-8 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-book-text">My Library</h1>
            <p className="text-book-muted mt-1">
              {books.length} {books.length === 1 ? 'book' : 'books'} in your collection
            </p>
          </div>

          <button
            onClick={handleSelectFiles}
            disabled={isImporting}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isImporting ? 'Importing...' : 'Add PDF'}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-book-muted" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  filterMode === tab.id
                    ? 'bg-book-accent/15 text-book-accent'
                    : 'text-book-muted hover:bg-book-surface'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Book grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {filteredBooks.length === 0 ? (
          <EmptyState onAdd={handleSelectFiles} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} onOpen={handleOpenBook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Empty state shown when no books are in the library
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
      <div className="w-24 h-24 rounded-2xl bg-book-surface flex items-center justify-center mb-6">
        <Grid3x3 className="w-12 h-12 text-book-muted" strokeWidth={1.5} />
      </div>
      <h2 className="font-display text-2xl text-book-text mb-2">Your library is empty</h2>
      <p className="text-book-muted mb-6 max-w-md">
        Drag and drop PDF files here, or click the button below to add your first book.
      </p>
      <button onClick={onAdd} className="btn-primary flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Add Your First PDF
      </button>
    </div>
  );
}
