// src/renderer/components/ReaderSidebar.tsx
// Sidebar panel in reading mode — bookmarks, highlights, notes, TOC, search

import { useState, useMemo } from 'react';
import {
  BookMarked, Highlighter, StickyNote, List, Search,
  Trash2, ChevronRight, Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import type { TableOfContentsItem } from '../../shared/types';

interface ReaderSidebarProps {
  toc: TableOfContentsItem[];
  onNavigatePage: (page: number) => void;
  onExport: () => void;
}

export default function ReaderSidebar({ toc, onNavigatePage, onExport }: ReaderSidebarProps) {
  const {
    activeSidebarTab, setActiveSidebarTab,
    bookmarks, removeBookmark,
    highlights, removeHighlight,
    annotations, addAnnotation, removeAnnotation,
    currentBook, currentPage,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const tabs = [
    { id: 'bookmarks' as const, label: 'Bookmarks', icon: BookMarked, count: bookmarks.length },
    { id: 'highlights' as const, label: 'Highlights', icon: Highlighter, count: highlights.length },
    { id: 'notes' as const, label: 'Notes', icon: StickyNote, count: annotations.length },
    { id: 'toc' as const, label: 'Contents', icon: List, count: toc.length },
    { id: 'search' as const, label: 'Search', icon: Search, count: null },
  ];

  // Filter highlights for search
  const filteredHighlights = useMemo(() => {
    if (!searchQuery) return highlights;
    return highlights.filter(
      (h) => h.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (h.note?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
  }, [highlights, searchQuery]);

  const handleAddNote = () => {
    if (!currentBook || !noteInput.trim()) return;
    window.electronAPI.annotations.add({
      book_id: currentBook.id,
      page_number: currentPage,
      type: 'note',
      content: noteInput.trim(),
      position_x: null,
      position_y: null,
      width: null,
      height: null,
      color: null,
    }).then((ann: any) => {
      addAnnotation(ann);
      setNoteInput('');
    });
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-book-surface border-l border-book-border flex flex-col">
      {/* Tab buttons */}
      <div className="flex border-b border-book-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSidebarTab(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative',
                activeSidebarTab === tab.id
                  ? 'text-book-accent'
                  : 'text-book-muted hover:text-book-text'
              )}
              title={tab.label}
            >
              <Icon className="w-4 h-4" />
              {tab.count !== null && (
                <span className="text-xs tabular-nums">{tab.count}</span>
              )}
              {activeSidebarTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-book-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* BOOKMARKS */}
        {activeSidebarTab === 'bookmarks' && (
          <div className="space-y-2">
            {bookmarks.length === 0 ? (
              <EmptyTab icon={BookMarked} message="No bookmarks yet. Press Ctrl+B to bookmark a page." />
            ) : (
              bookmarks
                .sort((a, b) => a.page_number - b.page_number)
                .map((bm) => (
                  <div
                    key={bm.id}
                    className="card p-3 group cursor-pointer hover:border-book-accent/50 transition-colors"
                    onClick={() => onNavigatePage(bm.page_number)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-book-text truncate">{bm.title}</p>
                        <p className="text-xs text-book-muted mt-0.5">Page {bm.page_number}</p>
                        {bm.note && <p className="text-xs text-book-muted mt-1 line-clamp-2">{bm.note}</p>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.electronAPI.bookmarks.delete(bm.id);
                          removeBookmark(bm.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-book-muted hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* HIGHLIGHTS */}
        {activeSidebarTab === 'highlights' && (
          <div className="space-y-2">
            {highlights.length === 0 ? (
              <EmptyTab icon={Highlighter} message="Select text in the book to highlight it." />
            ) : (
              highlights
                .sort((a, b) => a.page_number - b.page_number)
                .map((hl) => (
                  <div
                    key={hl.id}
                    className="card p-3 group cursor-pointer hover:border-book-accent/50 transition-colors"
                    onClick={() => onNavigatePage(hl.page_number)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('w-2 h-2 rounded-full', `highlight-${hl.color}`)} />
                          <span className="text-xs text-book-muted">Page {hl.page_number}</span>
                        </div>
                        <p className="text-sm text-book-text line-clamp-3 font-serif italic">
                          "{hl.text}"
                        </p>
                        {hl.note && <p className="text-xs text-book-muted mt-1">{hl.note}</p>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.electronAPI.highlights.delete(hl.id);
                          removeHighlight(hl.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-book-muted hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* NOTES */}
        {activeSidebarTab === 'notes' && (
          <div className="space-y-3">
            {/* Add note input */}
            <div className="card p-3">
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={`Add a note for page ${currentPage}...`}
                className="input text-sm resize-none mb-2"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteInput.trim()}
                className="btn-primary w-full text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>

            {/* Notes list */}
            {annotations.length === 0 ? (
              <EmptyTab icon={StickyNote} message="No notes yet. Add your first note above." />
            ) : (
              annotations
                .sort((a, b) => a.page_number - b.page_number)
                .map((ann) => (
                  <div key={ann.id} className="card p-3 group cursor-pointer hover:border-book-accent/50 transition-colors"
                    onClick={() => onNavigatePage(ann.page_number)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-book-muted">Page {ann.page_number}</span>
                        <p className="text-sm text-book-text mt-1 whitespace-pre-wrap">{ann.content}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.electronAPI.annotations.delete(ann.id);
                          removeAnnotation(ann.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-book-muted hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* TABLE OF CONTENTS */}
        {activeSidebarTab === 'toc' && (
          <div className="space-y-1">
            {toc.length === 0 ? (
              <EmptyTab icon={List} message="No table of contents found in this PDF." />
            ) : (
              toc.map((item, idx) => (
                <TocItem key={idx} item={item} onNavigate={onNavigatePage} />
              ))
            )}
          </div>
        )}

        {/* SEARCH */}
        {activeSidebarTab === 'search' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-book-muted" />
              <input
                type="text"
                placeholder="Search highlights and notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 text-sm"
              />
            </div>

            {searchQuery && (
              <div className="space-y-2">
                <p className="text-xs text-book-muted uppercase tracking-wider">Results</p>
                {filteredHighlights.length === 0 ? (
                  <p className="text-sm text-book-muted text-center py-4">No matches found</p>
                ) : (
                  filteredHighlights.map((hl) => (
                    <div
                      key={hl.id}
                      className="card p-3 cursor-pointer hover:border-book-accent/50 transition-colors"
                      onClick={() => onNavigatePage(hl.page_number)}
                    >
                      <span className="text-xs text-book-muted">Page {hl.page_number}</span>
                      <p className="text-sm text-book-text mt-1 line-clamp-2 font-serif italic">"{hl.text}"</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export button at bottom */}
      <div className="p-3 border-t border-book-border">
        <button
          onClick={onExport}
          className="btn-ghost w-full text-sm flex items-center justify-center gap-2"
        >
          Export Annotations
        </button>
      </div>
    </aside>
  );
}

// Recursive TOC item
function TocItem({ item, onNavigate, level = 0 }: { item: TableOfContentsItem; onNavigate: (p: number) => void; level?: number }) {
  const [expanded, setExpanded] = useState(level < 1);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-book-bg transition-colors"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => hasChildren ? setExpanded(!expanded) : onNavigate(item.pageNumber)}
      >
        {hasChildren ? (
          <ChevronRight className={cn('w-3.5 h-3.5 text-book-muted transition-transform', expanded && 'rotate-90')} />
        ) : (
          <span className="w-3.5" />
        )}
        <span className="text-sm text-book-text flex-1 truncate font-serif">{item.title}</span>
        {item.pageNumber > 0 && (
          <span className="text-xs text-book-muted tabular-nums">{item.pageNumber}</span>
        )}
      </div>
      {expanded && hasChildren && item.children!.map((child, idx) => (
        <TocItem key={idx} item={child} onNavigate={onNavigate} level={level + 1} />
      ))}
    </div>
  );
}

// Empty state for sidebar tabs
function EmptyTab({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-8 h-8 text-book-muted mb-3" strokeWidth={1.5} />
      <p className="text-sm text-book-muted px-4">{message}</p>
    </div>
  );
}
