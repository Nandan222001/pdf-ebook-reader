// src/renderer/views/ReaderView.tsx
// Full immersive reading mode with page-flip animation, PDF rendering,
// zoom controls, themes, and annotation sidebar

import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import HTMLFlipBook from 'react-pageflip';
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize,
  BookMarked, Highlighter, StickyNote, List, Search,
  X, Settings2, Sun, Moon, BookOpen, PanelRightClose,
  PanelRightOpen, ChevronFirst, ChevronLast, Bookmark,
  BookmarkCheck, Download
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, playPageTurnSound, debounce } from '../lib/utils';
import ReaderSidebar from '../components/ReaderSidebar';
import HighlightPopup from '../components/HighlightPopup';
import type { Book, HighlightColor, TableOfContentsItem } from '../../shared/types';

// pdf.js worker setup
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ReaderViewProps {
  onExit: () => void;
}

export default function ReaderView({ onExit }: ReaderViewProps) {
  const {
    currentBook, currentPage, setCurrentPage, totalPages, setTotalPages,
    viewMode, setViewMode, zoom, setZoom, theme, setTheme,
    bookmarks, setBookmarks, addBookmark, removeBookmark,
    highlights, setHighlights, addHighlight, removeHighlight,
    annotations, setAnnotations, addAnnotation,
    profile, sidebarOpen, setSidebarOpen, activeSidebarTab, setActiveSidebarTab,
    startSession, endSession, updateBook,
  } = useStore();

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageInput, setPageInput] = useState(currentPage);
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);
  const [showToolbar, setShowToolbar] = useState(true);
  const [selectedText, setSelectedText] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const flipBookRef = useRef<any>(null);
  const hideToolbarTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load PDF document
  useEffect(() => {
    if (!currentBook) return;

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const result = await window.electronAPI.pdf.open(currentBook.file_path);
        if (cancelled) return;

        setPdfData(result.buffer);

        // Load bookmarks, highlights, annotations
        const [bms, hls, anns] = await Promise.all([
          window.electronAPI.bookmarks.getAll(currentBook.id),
          window.electronAPI.highlights.getAll(currentBook.id),
          window.electronAPI.annotations.getAll(currentBook.id),
        ]);

        if (!cancelled) {
          setBookmarks(bms);
          setHighlights(hls);
          setAnnotations(anns);
        }

        // Start reading session
        startSession(currentBook.last_read_page || 1);
      } catch (error) {
        console.error('Failed to load PDF:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBook?.id]);

  // Auto-save progress (debounced)
  const saveProgress = useCallback(
    debounce((page: number, total: number) => {
      if (currentBook) {
        window.electronAPI.library.updateProgress(currentBook.id, page, total);
        updateBook(currentBook.id, { last_read_page: page, progress: total > 0 ? (page / total) * 100 : 0 });
      }
    }, 1000),
    [currentBook]
  );

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;

    // Play page-turn sound
    if (profile?.preferences.pageFlipSound) {
      playPageTurnSound(profile.preferences.soundVolume);
    }

    setCurrentPage(newPage);
    setPageInput(newPage);
    saveProgress(newPage, totalPages);
  }, [totalPages, profile, setCurrentPage, saveProgress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (e.key === 'Escape') {
        onExit();
      } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setActiveSidebarTab('search');
        setSidebarOpen(true);
      } else if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleToggleBookmark();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, totalPages, handlePageChange]);

  // Auto-hide toolbar
  const resetToolbarTimer = useCallback(() => {
    setShowToolbar(true);
    clearTimeout(hideToolbarTimer.current);
    hideToolbarTimer.current = setTimeout(() => {
      if (!selectedText) setShowToolbar(false);
    }, 3000);
  }, [selectedText]);

  useEffect(() => {
    resetToolbarTimer();
    return () => clearTimeout(hideToolbarTimer.current);
  }, [currentPage, resetToolbarTimer]);

  // Toggle bookmark on current page
  const handleToggleBookmark = useCallback(() => {
    if (!currentBook) return;
    const existing = bookmarks.find((b) => b.page_number === currentPage);
    if (existing) {
      window.electronAPI.bookmarks.delete(existing.id);
      removeBookmark(existing.id);
    } else {
      const newBm = window.electronAPI.bookmarks.add(
        currentBook.id,
        currentPage,
        `Page ${currentPage}`,
        null
      );
      // addBookmark expects a Bookmark, but the IPC returns a promise
      newBm.then((bm: any) => addBookmark(bm));
    }
  }, [currentBook, currentPage, bookmarks, addBookmark, removeBookmark]);

  // Handle text selection for highlighting
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText({ text: selection.toString().trim(), rect });
    } else {
      setSelectedText(null);
    }
  }, []);

  // Create highlight
  const handleCreateHighlight = useCallback((color: HighlightColor) => {
    if (!currentBook || !selectedText) return;

    const newHl = {
      book_id: currentBook.id,
      page_number: currentPage,
      text: selectedText.text,
      color,
      note: null,
      start_position: 0,
      end_position: selectedText.text.length,
    };

    window.electronAPI.highlights.add(newHl).then((hl: any) => {
      addHighlight(hl);
    });

    setSelectedText(null);
    window.getSelection()?.removeAllRanges();
  }, [currentBook, currentPage, selectedText, addHighlight]);

  // Export annotations
  const handleExport = useCallback(async () => {
    if (!currentBook) return;

    const exportData = {
      book: { title: currentBook.title, author: currentBook.author },
      exported_at: new Date().toISOString(),
      highlights: highlights.map((h) => ({
        page: h.page_number, text: h.text, color: h.color, note: h.note
      })),
      bookmarks: bookmarks.map((b) => ({
        page: b.page_number, title: b.title, note: b.note
      })),
      annotations: annotations.map((a) => ({
        page: a.page_number, type: a.type, content: a.content
      })),
    };

    // Convert to markdown
    let md = `# Annotations for ${currentBook.title}\n\n`;
    md += `**Author:** ${currentBook.author || 'Unknown'}\n`;
    md += `**Exported:** ${new Date().toLocaleString()}\n\n`;

    if (highlights.length > 0) {
      md += `## Highlights\n\n`;
      highlights.forEach((h) => {
        md += `### Page ${h.page_number}\n`;
        md += `> ${h.text}\n`;
        if (h.note) md += `**Note:** ${h.note}\n`;
        md += `*Color: ${h.color}*\n\n`;
      });
    }

    if (bookmarks.length > 0) {
      md += `## Bookmarks\n\n`;
      bookmarks.forEach((b) => {
        md += `- **Page ${b.page_number}:** ${b.title}${b.note ? ` — ${b.note}` : ''}\n`;
      });
      md += `\n`;
    }

    if (annotations.length > 0) {
      md += `## Notes\n\n`;
      annotations.forEach((a) => {
        md += `### Page ${a.page_number} (${a.type})\n${a.content}\n\n`;
      });
    }

    await window.electronAPI.file.saveExport(
      `${currentBook.title}_annotations.md`,
      md
    );
  }, [currentBook, highlights, bookmarks, annotations]);

  // Document load success
  const onDocumentLoadSuccess = useCallback((doc: any) => {
    setPdfDoc(doc);
    setTotalPages(doc.numPages);

    // Update book page count if not set
    if (currentBook && currentBook.page_count === 0) {
      window.electronAPI.library.update(currentBook.id, { page_count: doc.numPages });
      updateBook(currentBook.id, { page_count: doc.numPages });
    }

    // Parse TOC if available
    doc.getOutline().then((outline: any[] | null) => {
      if (outline && outline.length > 0) {
        const parseToc = (items: any[], level: number = 0): TableOfContentsItem[] => {
          return items.map((item) => ({
            title: item.title,
            pageNumber: 0, // Will be resolved on click via dest
            level,
            children: item.items?.length ? parseToc(item.items, level + 1) : undefined,
          }));
        };
        setToc(parseToc(outline));
      }
    }).catch(() => {});
  }, [currentBook, setTotalPages, updateBook]);

  const isBookmarked = bookmarks.some((b) => b.page_number === currentPage);

  const themeIcons = {
    dark: Moon,
    light: Sun,
    sepia: BookOpen,
    parchment: BookOpen,
  };
  const ThemeIcon = themeIcons[theme] || Moon;

  if (!currentBook) {
    return null;
  }

  return (
    <div
      className="h-full flex flex-col bg-book-bg relative"
      onMouseMove={resetToolbarTimer}
      onMouseUp={handleTextSelection}
    >
      {/* === TOP TOOLBAR === */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-40 transition-transform duration-300',
          'bg-book-surface/95 backdrop-blur-md border-b border-book-border',
          showToolbar ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-2.5 gap-4">
          {/* Left: Exit + Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button onClick={onExit} className="btn-ghost p-2" title="Back to Library (Esc)">
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="font-serif text-sm font-medium text-book-text truncate">
                {currentBook.title}
              </h2>
              <p className="text-xs text-book-muted truncate">
                {currentBook.author || 'Unknown Author'}
              </p>
            </div>
          </div>

          {/* Center: Page navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              className="btn-ghost p-2"
              title="First Page"
              disabled={currentPage <= 1}
            >
              <ChevronFirst className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="btn-ghost p-2"
              title="Previous Page (←)"
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-2">
              <input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(Number(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePageChange(pageInput);
                }}
                className="w-14 text-center bg-book-bg border border-book-border rounded px-1 py-1 text-sm text-book-text"
                min={1}
                max={totalPages}
              />
              <span className="text-sm text-book-muted">/ {totalPages}</span>
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="btn-ghost p-2"
              title="Next Page (→)"
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              className="btn-ghost p-2"
              title="Last Page"
              disabled={currentPage >= totalPages}
            >
              <ChevronLast className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Tools */}
          <div className="flex items-center gap-1 flex-1 justify-end">
            {/* Bookmark toggle */}
            <button
              onClick={handleToggleBookmark}
              className={cn('btn-ghost p-2', isBookmarked && 'text-book-accent')}
              title="Toggle Bookmark (Ctrl+B)"
            >
              {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>

            {/* Zoom controls */}
            <div className="flex items-center gap-0.5 border-l border-book-border pl-1">
              <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="btn-ghost p-2" title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-book-muted w-12 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="btn-ghost p-2" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setZoom(1)} className="btn-ghost p-2" title="Reset Zoom">
                <Maximize className="w-4 h-4" />
              </button>
            </div>

            {/* View mode toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'single' ? 'spread' : 'single')}
              className="btn-ghost p-2"
              title={viewMode === 'single' ? 'Switch to Two-Page Spread' : 'Switch to Single Page'}
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Theme cycle */}
            <button
              onClick={() => {
                const themes: Array<'dark' | 'light' | 'sepia' | 'parchment'> = ['dark', 'light', 'sepia', 'parchment'];
                const idx = themes.indexOf(theme);
                setTheme(themes[(idx + 1) % themes.length]);
              }}
              className="btn-ghost p-2"
              title="Cycle Theme"
            >
              <ThemeIcon className="w-4 h-4" />
            </button>

            {/* Export */}
            <button onClick={handleExport} className="btn-ghost p-2" title="Export Annotations">
              <Download className="w-4 h-4" />
            </button>

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn-ghost p-2"
              title="Toggle Sidebar"
            >
              {sidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* === PDF VIEWER AREA === */}
      <div className="flex-1 flex overflow-hidden pt-14">
        {/* PDF rendering area */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center p-4"
          style={{ cursor: selectedText ? 'text' : 'default' }}
        >
          {isLoading && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-book-border border-t-book-accent animate-spin" />
              <p className="text-book-muted font-serif">Loading book...</p>
            </div>
          )}

          {pdfData && (
            <Document
              file={{ data: pdfData }}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => console.error('PDF load error:', error)}
              loading={null}
              className={cn(viewMode === 'spread' && 'book-spread')}
            >
              {viewMode === 'single' ? (
                <div className="book-page rounded-lg shadow-2xl animate-fade-in" key={currentPage}>
                  <Page
                    pageNumber={currentPage}
                    scale={zoom}
                    className="pdf-page"
                    onLoadSuccess={() => setIsLoading(false)}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              ) : (
                /* Two-page spread view */
                <div className="flex gap-0 book-spread animate-fade-in" key={Math.ceil(currentPage / 2)}>
                  {/* Left page */}
                  {currentPage > 1 && (
                    <div className="book-page rounded-l-lg shadow-2xl border-r border-book-border/30">
                      <Page
                        pageNumber={currentPage - (currentPage % 2 === 0 ? 1 : 0)}
                        scale={zoom}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </div>
                  )}
                  {/* Right page */}
                  <div className="book-page rounded-r-lg shadow-2xl">
                    <Page
                      pageNumber={currentPage % 2 === 0 ? currentPage : currentPage}
                      scale={zoom}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onLoadSuccess={() => setIsLoading(false)}
                    />
                  </div>
                </div>
              )}
            </Document>
          )}
        </div>

        {/* === SIDEBAR === */}
        {sidebarOpen && (
          <ReaderSidebar
            toc={toc}
            onNavigatePage={handlePageChange}
            onExport={handleExport}
          />
        )}
      </div>

      {/* === BOTTOM PROGRESS BAR === */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300',
          'bg-book-surface/95 backdrop-blur-md border-t border-book-border px-4 py-2',
          showToolbar ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex items-center gap-4">
          <span className="text-xs text-book-muted tabular-nums">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex-1 progress-bar h-2">
            <div
              className="progress-bar-fill"
              style={{ width: `${totalPages > 0 ? (currentPage / totalPages) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-book-muted tabular-nums">
            {totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* === HIGHLIGHT POPUP === */}
      {selectedText && (
        <HighlightPopup
          selectedText={selectedText}
          onHighlight={handleCreateHighlight}
          onClose={() => setSelectedText(null)}
        />
      )}
    </div>
  );
}
