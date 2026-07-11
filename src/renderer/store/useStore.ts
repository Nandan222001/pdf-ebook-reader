// src/renderer/store/useStore.ts
// Zustand global state management

import { create } from 'zustand';
import type {
  Book, Bookmark, Highlight, Annotation, ReadingStats,
  UserProfile, UserPreferences, ThemeName, TableOfContentsItem
} from '../../shared/types';

interface AppStore {
  // === Library State ===
  books: Book[];
  isLoadingBooks: boolean;
  searchQuery: string;
  filterMode: 'all' | 'recent' | 'favorites';
  setBooks: (books: Book[]) => void;
  setLoadingBooks: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterMode: (mode: 'all' | 'recent' | 'favorites') => void;
  addBook: (book: Book) => void;
  updateBook: (id: number, updates: Partial<Book>) => void;
  removeBook: (id: number) => void;

  // === Current Reading State ===
  currentBook: Book | null;
  currentPage: number;
  totalPages: number;
  isReading: boolean;
  viewMode: 'single' | 'spread';
  zoom: number;
  setCurrentBook: (book: Book | null) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setIsReading: (reading: boolean) => void;
  setViewMode: (mode: 'single' | 'spread') => void;
  setZoom: (zoom: number) => void;

  // === Bookmarks ===
  bookmarks: Bookmark[];
  setBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: number) => void;

  // === Highlights ===
  highlights: Highlight[];
  setHighlights: (highlights: Highlight[]) => void;
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (id: number) => void;
  updateHighlight: (id: number, updates: Partial<Highlight>) => void;

  // === Annotations ===
  annotations: Annotation[];
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: number) => void;

  // === Profile & Preferences ===
  profile: UserProfile | null;
  theme: ThemeName;
  setProfile: (profile: UserProfile) => void;
  setTheme: (theme: ThemeName) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;

  // === Stats ===
  stats: ReadingStats | null;
  setStats: (stats: ReadingStats) => void;

  // === TOC ===
  tableOfContents: TableOfContentsItem[];
  setTableOfContents: (toc: TableOfContentsItem[]) => void;

  // === UI State ===
  sidebarOpen: boolean;
  activeSidebarTab: 'bookmarks' | 'highlights' | 'notes' | 'toc' | 'search';
  setSidebarOpen: (open: boolean) => void;
  setActiveSidebarTab: (tab: 'bookmarks' | 'highlights' | 'notes' | 'toc' | 'search') => void;

  // === Reading Session Tracking ===
  sessionStartTime: number;
  sessionStartPage: number;
  startSession: (page: number) => void;
  endSession: () => void;
}

export const useStore = create<AppStore>((set, get) => ({
  // Library
  books: [],
  isLoadingBooks: false,
  searchQuery: '',
  filterMode: 'all',
  setBooks: (books) => set({ books }),
  setLoadingBooks: (loading) => set({ isLoadingBooks: loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterMode: (mode) => set({ filterMode: mode }),
  addBook: (book) => set((state) => ({ books: [book, ...state.books] })),
  updateBook: (id, updates) =>
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      currentBook: state.currentBook?.id === id ? { ...state.currentBook, ...updates } : state.currentBook,
    })),
  removeBook: (id) =>
    set((state) => ({
      books: state.books.filter((b) => b.id !== id),
      currentBook: state.currentBook?.id === id ? null : state.currentBook,
    })),

  // Current Reading
  currentBook: null,
  currentPage: 1,
  totalPages: 0,
  isReading: false,
  viewMode: 'single',
  zoom: 1.0,
  setCurrentBook: (book) => set({ currentBook: book }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  setIsReading: (reading) => set({ isReading: reading }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setZoom: (zoom) => set({ zoom }),

  // Bookmarks
  bookmarks: [],
  setBookmarks: (bookmarks) => set({ bookmarks }),
  addBookmark: (bookmark) => set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
  removeBookmark: (id) => set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) })),

  // Highlights
  highlights: [],
  setHighlights: (highlights) => set({ highlights }),
  addHighlight: (highlight) => set((state) => ({ highlights: [...state.highlights, highlight] })),
  removeHighlight: (id) => set((state) => ({ highlights: state.highlights.filter((h) => h.id !== id) })),
  updateHighlight: (id, updates) =>
    set((state) => ({
      highlights: state.highlights.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),

  // Annotations
  annotations: [],
  setAnnotations: (annotations) => set({ annotations }),
  addAnnotation: (annotation) => set((state) => ({ annotations: [...state.annotations, annotation] })),
  removeAnnotation: (id) => set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) })),

  // Profile & Preferences
  profile: null,
  theme: 'dark',
  setProfile: (profile) => set({ profile, theme: profile.preferences.theme }),
  setTheme: (theme) => {
    set({ theme });
    // Apply theme to <html> element
    const html = document.documentElement;
    html.className = theme;
    // Persist to DB
    window.electronAPI.profile.updatePreferences({ theme });
  },
  updatePreferences: (prefs) => {
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, preferences: { ...state.profile.preferences, ...prefs } }
        : state.profile,
    }));
    window.electronAPI.profile.updatePreferences(prefs);
  },

  // Stats
  stats: null,
  setStats: (stats) => set({ stats }),

  // TOC
  tableOfContents: [],
  setTableOfContents: (toc) => set({ tableOfContents: toc }),

  // UI
  sidebarOpen: true,
  activeSidebarTab: 'bookmarks',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),

  // Reading Session
  sessionStartTime: 0,
  sessionStartPage: 1,
  startSession: (page) => set({ sessionStartTime: Date.now(), sessionStartPage: page }),
  endSession: () => {
    const state = get();
    if (state.sessionStartTime === 0 || !state.currentBook) return;

    const duration = Math.floor((Date.now() - state.sessionStartTime) / 1000);
    const pagesRead = Math.abs(state.currentPage - state.sessionStartPage);

    if (duration > 5 && pagesRead >= 0) {
      window.electronAPI.stats.addSession({
        book_id: state.currentBook.id,
        start_page: state.sessionStartPage,
        end_page: state.currentPage,
        pages_read: Math.max(pagesRead, 1),
        duration_seconds: duration,
        started_at: new Date(state.sessionStartTime).toISOString(),
        ended_at: new Date().toISOString(),
      });
    }

    set({ sessionStartTime: 0, sessionStartPage: 1 });
  },
}));
