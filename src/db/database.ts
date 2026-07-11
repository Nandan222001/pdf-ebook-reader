// src/db/database.ts
// Database connection management and initialization

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { SCHEMA_SQL, SEED_SQL } from './schema';

let dbInstance: Database.Database | null = null;

/**
 * Get the database file path in the user data directory.
 * This ensures the database persists across app updates.
 */
function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');

  // Ensure the directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, 'ebook_reader.db');
}

/**
 * Initialize the database connection and run migrations.
 * Called once when the app starts.
 */
export function initDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDbPath();
  console.log(`[DB] Initializing database at: ${dbPath}`);

  const db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Execute schema (CREATE TABLE IF NOT EXISTS is idempotent)
  db.exec(SCHEMA_SQL);

  // Seed default data
  db.exec(SEED_SQL);

  dbInstance = db;
  console.log('[DB] Database initialized successfully');

  return db;
}

/**
 * Get the current database instance.
 * Throws if the database hasn't been initialized.
 */
export function getDb(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

/**
 * Close the database connection gracefully.
 * Called when the app is quitting.
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[DB] Database connection closed');
  }
}

/**
 * Backup the database to a specified file path.
 */
export function backupDatabase(targetPath: string): void {
  const db = getDb();
  const backup = db.backup(targetPath);
  backup.step(-1); // Complete the backup in one step
  if (backup.remaining === 0) {
    console.log(`[DB] Backup completed: ${targetPath}`);
  } else {
    throw new Error('Database backup did not complete');
  }
}

/**
 * Restore the database from a backup file.
 */
export function restoreDatabase(sourcePath: string): void {
  closeDatabase();

  const dbPath = getDbPath();
  fs.copyFileSync(sourcePath, dbPath);

  // Reinitialize
  initDatabase();
  console.log(`[DB] Database restored from: ${sourcePath}`);
}
