// src/shared/types.ts
// Shared types used across main and renderer processes

export interface UserProfile {
  id: number;
  name: string;
  email: string | null;
  avatar_path: string | null;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: ThemeName;
  fontSize: number;
  fontFamily: string;
  pageFlipSound: boolean;
  soundVolume: number;
  defaultView: 'single' | 'spread';
  autoSaveInterval: number; // seconds
  showPageNumbers: boolean;
  keyboardShortcuts: boolean;
}

export type ThemeName = 'dark' | 'light' | 'sepia' | 'parchment';

export interface Book {
  id: number;
  title: string;
  author: string | null;
  file_path: string;
  file_size: number;
  page_count: number;
  cover_thumbnail: string | null; // base64 or file path
  last_read_page: number;
  progress: number; // 0-100
  is_favorite: boolean;
  date_added: string;
  last_opened: string | null;
  tags: string[];
  metadata: BookMetadata;
}

export interface BookMetadata {
  publisher?: string;
  publishDate?: string;
  isbn?: string;
  language?: string;
  description?: string;
}

export interface Bookmark {
  id: number;
  book_id: number;
  page_number: number;
  title: string;
  note: string | null;
  created_at: string;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface Highlight {
  id: number;
  book_id: number;
  page_number: number;
  text: string;
  color: HighlightColor;
  note: string | null;
  start_position: number;
  end_position: number;
  created_at: string;
  updated_at: string;
}

export interface Annotation {
  id: number;
  book_id: number;
  page_number: number;
  type: 'note' | 'sticky' | 'drawing';
  content: string;
  position_x: number | null;
  position_y: number | null;
  width: number | null;
  height: number | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingSession {
  id: number;
  book_id: number;
  start_page: number;
  end_page: number;
  pages_read: number;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
}

export interface ReadingStats {
  totalBooks: number;
  totalPagesRead: number;
  totalTimeSpent: number; // seconds
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string | null;
  dailyStats: DailyStat[];
}

export interface DailyStat {
  date: string;
  pagesRead: number;
  timeSpent: number;
}

export interface TableOfContentsItem {
  title: string;
  pageNumber: number;
  level: number;
  children?: TableOfContentsItem[];
}

export interface SearchResult {
  bookId: number;
  bookTitle: string;
  pageNumber: number;
  snippet: string;
  type: 'library' | 'book';
}

export interface ExportFormat {
  format: 'json' | 'markdown' | 'pdf';
  includeHighlights: boolean;
  includeBookmarks: boolean;
  includeNotes: boolean;
}

// IPC Channel definitions
export const IPC_CHANNELS = {
  // Library
  LIBRARY_GET_ALL: 'library:getAll',
  LIBRARY_GET_ONE: 'library:getOne',
  LIBRARY_ADD: 'library:add',
  LIBRARY_UPDATE: 'library:update',
  LIBRARY_DELETE: 'library:delete',
  LIBRARY_TOGGLE_FAVORITE: 'library:toggleFavorite',
  LIBRARY_UPDATE_PROGRESS: 'library:updateProgress',
  LIBRARY_SEARCH: 'library:search',

  // Bookmarks
  BOOKMARK_GET_ALL: 'bookmark:getAll',
  BOOKMARK_ADD: 'bookmark:add',
  BOOKMARK_DELETE: 'bookmark:delete',
  BOOKMARK_UPDATE: 'bookmark:update',

  // Highlights
  HIGHLIGHT_GET_ALL: 'highlight:getAll',
  HIGHLIGHT_ADD: 'highlight:add',
  HIGHLIGHT_DELETE: 'highlight:delete',
  HIGHLIGHT_UPDATE: 'highlight:update',

  // Annotations
  ANNOTATION_GET_ALL: 'annotation:getAll',
  ANNOTATION_ADD: 'annotation:add',
  ANNOTATION_DELETE: 'annotation:delete',
  ANNOTATION_UPDATE: 'annotation:update',

  // Reading Stats
  STATS_GET: 'stats:get',
  STATS_ADD_SESSION: 'stats:addSession',
  STATS_GET_DAILY: 'stats:getDaily',

  // User Profile
  PROFILE_GET: 'profile:get',
  PROFILE_UPDATE: 'profile:update',
  PROFILE_UPDATE_PREFERENCES: 'profile:updatePreferences',

  // PDF Operations
  PDF_OPEN: 'pdf:open',
  PDF_GET_THUMBNAIL: 'pdf:getThumbnail',
  PDF_GET_TOC: 'pdf:getToc',
  PDF_SEARCH_TEXT: 'pdf:searchText',
  PDF_EXPORT_ANNOTATIONS: 'pdf:exportAnnotations',

  // File Operations
  FILE_SELECT_PDF: 'file:selectPdf',
  FILE_SAVE_EXPORT: 'file:saveExport',

  // Database
  DB_BACKUP: 'db:backup',
  DB_RESTORE: 'db:restore',
} as const;
