// src/db/schema.ts
// SQLite database schema definition and migration logic

export const SCHEMA_SQL = `
-- User Profile table (single row, id=1)
CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL DEFAULT 'Reader',
  email TEXT,
  avatar_path TEXT,
  preferences TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Library: uploaded PDFs
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT,
  file_path TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  cover_thumbnail TEXT,
  last_read_page INTEGER NOT NULL DEFAULT 0,
  progress REAL NOT NULL DEFAULT 0.0,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',
  metadata TEXT NOT NULL DEFAULT '{}',
  date_added TEXT NOT NULL DEFAULT (datetime('now')),
  last_opened TEXT
);

-- Index for searching books by title/author
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_favorite ON books(is_favorite);
CREATE INDEX IF NOT EXISTS idx_books_last_opened ON books(last_opened);

-- Bookmarks: per PDF page markers
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_book ON bookmarks(book_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_page ON bookmarks(page_number);

-- Highlights: text selections with color and optional note
CREATE TABLE IF NOT EXISTS highlights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow',
  note TEXT,
  start_position INTEGER NOT NULL DEFAULT 0,
  end_position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_page ON highlights(page_number);

-- Annotations: page-specific notes, sticky notes, drawings
CREATE TABLE IF NOT EXISTS annotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  position_x REAL,
  position_y REAL,
  width REAL,
  height REAL,
  color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_annotations_book ON annotations(book_id);
CREATE INDEX IF NOT EXISTS idx_annotations_page ON annotations(page_number);

-- Reading Sessions: track reading time and pages
CREATE TABLE IF NOT EXISTS reading_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL,
  pages_read INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_book ON reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON reading_sessions(started_at);

-- Reading Streaks: daily reading tracking
CREATE TABLE IF NOT EXISTS reading_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  pages_read INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0,
  books_read INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_streaks_date ON reading_streaks(date);
`;

// Default preferences for new users
export const DEFAULT_PREFERENCES = {
  theme: 'dark' as const,
  fontSize: 16,
  fontFamily: 'EB Garamond',
  pageFlipSound: true,
  soundVolume: 0.3,
  defaultView: 'single' as const,
  autoSaveInterval: 30,
  showPageNumbers: true,
  keyboardShortcuts: true,
};

// Migration: insert default user profile if not exists
export const SEED_SQL = `
INSERT OR IGNORE INTO user_profile (id, name, preferences) VALUES (1, 'Reader', '${JSON.stringify(DEFAULT_PREFERENCES)}');
`;
