// src/db/repositories.ts
// Data access layer — all CRUD operations for books, bookmarks, highlights, annotations, stats

import { getDb } from './database';
import type {
  Book, Bookmark, Highlight, Annotation, ReadingSession,
  ReadingStats, DailyStat, UserProfile, UserPreferences,
  HighlightColor, TableOfContentsItem, SearchResult
} from '../shared/types';

// ============================================================
// BOOK REPOSITORY
// ============================================================

export const bookRepo = {
  getAll(): Book[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM books ORDER BY last_opened DESC NULLS LAST, date_added DESC
    `).all() as any[];
    return rows.map(rowToBook);
  },

  getById(id: number): Book | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as any;
    return row ? rowToBook(row) : null;
  },

  add(book: Omit<Book, 'id' | 'date_added' | 'last_opened' | 'progress' | 'last_read_page' | 'is_favorite' | 'tags' | 'metadata'> & Partial<Pick<Book, 'tags' | 'metadata'>>): Book {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO books (title, author, file_path, file_size, page_count, cover_thumbnail, tags, metadata)
      VALUES (@title, @author, @file_path, @file_size, @page_count, @cover_thumbnail, @tags, @metadata)
    `).run({
      title: book.title,
      author: book.author ?? null,
      file_path: book.file_path,
      file_size: book.file_size ?? 0,
      page_count: book.page_count ?? 0,
      cover_thumbnail: book.cover_thumbnail ?? null,
      tags: JSON.stringify(book.tags ?? []),
      metadata: JSON.stringify(book.metadata ?? {})
    });
    return this.getById(result.lastInsertRowid as number)!;
  },

  update(id: number, updates: Partial<Book>): void {
    const db = getDb();
    const current = this.getById(id);
    if (!current) throw new Error(`Book ${id} not found`);

    const merged = { ...current, ...updates };
    db.prepare(`
      UPDATE books SET
        title = @title, author = @author, file_path = @file_path,
        file_size = @file_size, page_count = @page_count,
        cover_thumbnail = @cover_thumbnail, last_read_page = @last_read_page,
        progress = @progress, is_favorite = @is_favorite,
        tags = @tags, metadata = @metadata, last_opened = @last_opened
      WHERE id = @id
    `).run({
      id,
      title: merged.title,
      author: merged.author,
      file_path: merged.file_path,
      file_size: merged.file_size,
      page_count: merged.page_count,
      cover_thumbnail: merged.cover_thumbnail,
      last_read_page: merged.last_read_page,
      progress: merged.progress,
      is_favorite: merged.is_favorite ? 1 : 0,
      tags: JSON.stringify(merged.tags),
      metadata: JSON.stringify(merged.metadata),
      last_opened: merged.last_opened ?? new Date().toISOString()
    });
  },

  delete(id: number): void {
    const db = getDb();
    db.prepare('DELETE FROM books WHERE id = ?').run(id);
  },

  toggleFavorite(id: number): Book | null {
    const book = this.getById(id);
    if (!book) return null;
    this.update(id, { is_favorite: !book.is_favorite });
    return this.getById(id);
  },

  updateProgress(id: number, page: number, pageCount: number): void {
    const db = getDb();
    const progress = pageCount > 0 ? (page / pageCount) * 100 : 0;
    db.prepare(`
      UPDATE books SET last_read_page = ?, progress = ?, last_opened = datetime('now')
      WHERE id = ?
    `).run(page, progress, id);
  },

  search(query: string): Book[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM books
      WHERE title LIKE '%' || ? || '%' OR author LIKE '%' || ? || '%'
      ORDER BY last_opened DESC NULLS LAST
    `).all(query, query) as any[];
    return rows.map(rowToBook);
  }
};

// ============================================================
// BOOKMARK REPOSITORY
// ============================================================

export const bookmarkRepo = {
  getByBook(bookId: number): Bookmark[] {
    const db = getDb();
    return db.prepare('SELECT * FROM bookmarks WHERE book_id = ? ORDER BY page_number ASC, created_at DESC')
      .all(bookId) as Bookmark[];
  },

  add(bookId: number, pageNumber: number, title: string, note: string | null): Bookmark {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO bookmarks (book_id, page_number, title, note) VALUES (?, ?, ?, ?)
    `).run(bookId, pageNumber, title, note);
    return db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(result.lastInsertRowid) as Bookmark;
  },

  update(id: number, title: string, note: string | null): void {
    const db = getDb();
    db.prepare('UPDATE bookmarks SET title = ?, note = ? WHERE id = ?').run(title, note, id);
  },

  delete(id: number): void {
    const db = getDb();
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
  }
};

// ============================================================
// HIGHLIGHT REPOSITORY
// ============================================================

export const highlightRepo = {
  getByBook(bookId: number): Highlight[] {
    const db = getDb();
    return db.prepare('SELECT * FROM highlights WHERE book_id = ? ORDER BY page_number ASC, created_at DESC')
      .all(bookId) as Highlight[];
  },

  getByPage(bookId: number, pageNumber: number): Highlight[] {
    const db = getDb();
    return db.prepare('SELECT * FROM highlights WHERE book_id = ? AND page_number = ? ORDER BY created_at DESC')
      .all(bookId, pageNumber) as Highlight[];
  },

  add(h: Omit<Highlight, 'id' | 'created_at' | 'updated_at'>): Highlight {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO highlights (book_id, page_number, text, color, note, start_position, end_position)
      VALUES (@book_id, @page_number, @text, @color, @note, @start_position, @end_position)
    `).run({
      book_id: h.book_id,
      page_number: h.page_number,
      text: h.text,
      color: h.color,
      note: h.note,
      start_position: h.start_position,
      end_position: h.end_position
    });
    return db.prepare('SELECT * FROM highlights WHERE id = ?').get(result.lastInsertRowid) as Highlight;
  },

  update(id: number, updates: Partial<Pick<Highlight, 'color' | 'note'>>): void {
    const db = getDb();
    const sets: string[] = [];
    const values: any[] = [];
    if (updates.color !== undefined) { sets.push('color = ?'); values.push(updates.color); }
    if (updates.note !== undefined) { sets.push('note = ?'); values.push(updates.note); }
    sets.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE highlights SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  },

  delete(id: number): void {
    const db = getDb();
    db.prepare('DELETE FROM highlights WHERE id = ?').run(id);
  }
};

// ============================================================
// ANNOTATION REPOSITORY
// ============================================================

export const annotationRepo = {
  getByBook(bookId: number): Annotation[] {
    const db = getDb();
    return db.prepare('SELECT * FROM annotations WHERE book_id = ? ORDER BY page_number ASC, created_at DESC')
      .all(bookId) as Annotation[];
  },

  getByPage(bookId: number, pageNumber: number): Annotation[] {
    const db = getDb();
    return db.prepare('SELECT * FROM annotations WHERE book_id = ? AND page_number = ? ORDER BY created_at DESC')
      .all(bookId, pageNumber) as Annotation[];
  },

  add(a: Omit<Annotation, 'id' | 'created_at' | 'updated_at'>): Annotation {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO annotations (book_id, page_number, type, content, position_x, position_y, width, height, color)
      VALUES (@book_id, @page_number, @type, @content, @position_x, @position_y, @width, @height, @color)
    `).run({
      book_id: a.book_id,
      page_number: a.page_number,
      type: a.type,
      content: a.content,
      position_x: a.position_x,
      position_y: a.position_y,
      width: a.width,
      height: a.height,
      color: a.color
    });
    return db.prepare('SELECT * FROM annotations WHERE id = ?').get(result.lastInsertRowid) as Annotation;
  },

  update(id: number, content: string): void {
    const db = getDb();
    db.prepare(`UPDATE annotations SET content = ?, updated_at = datetime('now') WHERE id = ?`).run(content, id);
  },

  delete(id: number): void {
    const db = getDb();
    db.prepare('DELETE FROM annotations WHERE id = ?').run(id);
  }
};

// ============================================================
// READING STATS REPOSITORY
// ============================================================

export const statsRepo = {
  addSession(session: Omit<ReadingSession, 'id'>): void {
    const db = getDb();
    const tx = db.transaction(() => {
      // Insert the session
      db.prepare(`
        INSERT INTO reading_sessions (book_id, start_page, end_page, pages_read, duration_seconds, started_at, ended_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        session.book_id, session.start_page, session.end_page,
        session.pages_read, session.duration_seconds,
        session.started_at, session.ended_at
      );

      // Update daily streak
      const today = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO reading_streaks (date, pages_read, time_spent, books_read)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(date) DO UPDATE SET
          pages_read = pages_read + ?,
          time_spent = time_spent + ?,
          books_read = books_read + 1
      `).run(today, session.pages_read, session.duration_seconds,
             session.pages_read, session.duration_seconds);
    });
    tx();
  },

  getStats(): ReadingStats {
    const db = getDb();
    const totalBooks = (db.prepare('SELECT COUNT(*) as count FROM books').get() as any).count;
    const totalPages = (db.prepare('SELECT COALESCE(SUM(pages_read), 0) as count FROM reading_sessions').get() as any).count;
    const totalTime = (db.prepare('SELECT COALESCE(SUM(duration_seconds), 0) as count FROM reading_sessions').get() as any).count;

    // Calculate streaks
    const streaks = db.prepare('SELECT date FROM reading_streaks ORDER BY date DESC').all() as { date: string }[];
    const { currentStreak, longestStreak } = calculateStreaks(streaks.map(s => s.date));

    const lastRead = streaks.length > 0 ? streaks[0].date : null;

    // Daily stats for last 30 days
    const dailyRows = db.prepare(`
      SELECT date, pages_read, time_spent FROM reading_streaks
      WHERE date >= date('now', '-30 days')
      ORDER BY date ASC
    `).all() as DailyStat[];

    return {
      totalBooks,
      totalPagesRead: totalPages,
      totalTimeSpent: totalTime,
      currentStreak,
      longestStreak,
      lastReadDate: lastRead,
      dailyStats: dailyRows
    };
  },

  getDailyStats(days: number = 30): DailyStat[] {
    const db = getDb();
    return db.prepare(`
      SELECT date, pages_read, time_spent FROM reading_streaks
      WHERE date >= date('now', ?)
      ORDER BY date ASC
    `).all(`-${days} days`) as DailyStat[];
  }
};

// ============================================================
// USER PROFILE REPOSITORY
// ============================================================

export const profileRepo = {
  get(): UserProfile {
    const db = getDb();
    const row = db.prepare('SELECT * FROM user_profile WHERE id = 1').get() as any;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      avatar_path: row.avatar_path,
      preferences: JSON.parse(row.preferences),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  },

  update(name: string, email: string | null, avatarPath: string | null): void {
    const db = getDb();
    db.prepare(`
      UPDATE user_profile SET name = ?, email = ?, avatar_path = ?, updated_at = datetime('now')
      WHERE id = 1
    `).run(name, email, avatarPath);
  },

  updatePreferences(prefs: Partial<UserPreferences>): void {
    const db = getDb();
    const current = this.get();
    const merged = { ...current.preferences, ...prefs };
    db.prepare(`
      UPDATE user_profile SET preferences = ?, updated_at = datetime('now') WHERE id = 1
    `).run(JSON.stringify(merged));
  }
};

// ============================================================
// HELPERS
// ============================================================

function rowToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    file_path: row.file_path,
    file_size: row.file_size,
    page_count: row.page_count,
    cover_thumbnail: row.cover_thumbnail,
    last_read_page: row.last_read_page,
    progress: row.progress,
    is_favorite: row.is_favorite === 1,
    tags: JSON.parse(row.tags || '[]'),
    metadata: JSON.parse(row.metadata || '{}'),
    date_added: row.date_added,
    last_opened: row.last_opened
  };
}

function calculateStreaks(dates: string[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Current streak: count consecutive days ending today or yesterday
  let currentStreak = 0;
  if (dates[0] === today || dates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (Math.round(diff) === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { currentStreak, longestStreak };
}
