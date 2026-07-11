// src/main/index.ts
// Electron main process — window management, IPC handlers, PDF processing

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../db/database';
import { IPC_CHANNELS } from '../shared/types';
import {
  bookRepo, bookmarkRepo, highlightRepo, annotationRepo,
  statsRepo, profileRepo
} from '../db/repositories';

let mainWindow: BrowserWindow | null = null;

// ============================================================
// WINDOW CREATION
// ============================================================

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: 'PDF eBook Reader',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    // Elegant frameless-ish window with title bar overlay
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
  });

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready (prevents flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================
// IPC HANDLERS
// ============================================================

function registerIpcHandlers(): void {

  // --- Library ---
  ipcMain.handle(IPC_CHANNELS.LIBRARY_GET_ALL, () => bookRepo.getAll());
  ipcMain.handle(IPC_CHANNELS.LIBRARY_GET_ONE, (_, id: number) => bookRepo.getById(id));
  ipcMain.handle(IPC_CHANNELS.LIBRARY_ADD, (_, book: any) => bookRepo.add(book));
  ipcMain.handle(IPC_CHANNELS.LIBRARY_UPDATE, (_, id: number, updates: any) => bookRepo.update(id, updates));
  ipcMain.handle(IPC_CHANNELS.LIBRARY_DELETE, (_, id: number) => bookRepo.delete(id));
  ipcMain.handle(IPC_CHANNELS.LIBRARY_TOGGLE_FAVORITE, (_, id: number) => bookRepo.toggleFavorite(id));
  ipcMain.handle(IPC_CHANNELS.LIBRARY_UPDATE_PROGRESS, (_, id: number, page: number, pageCount: number) =>
    bookRepo.updateProgress(id, page, pageCount)
  );
  ipcMain.handle(IPC_CHANNELS.LIBRARY_SEARCH, (_, query: string) => bookRepo.search(query));

  // --- Bookmarks ---
  ipcMain.handle(IPC_CHANNELS.BOOKMARK_GET_ALL, (_, bookId: number) => bookmarkRepo.getByBook(bookId));
  ipcMain.handle(IPC_CHANNELS.BOOKMARK_ADD, (_, bookId: number, page: number, title: string, note: string | null) =>
    bookmarkRepo.add(bookId, page, title, note)
  );
  ipcMain.handle(IPC_CHANNELS.BOOKMARK_UPDATE, (_, id: number, title: string, note: string | null) =>
    bookmarkRepo.update(id, title, note)
  );
  ipcMain.handle(IPC_CHANNELS.BOOKMARK_DELETE, (_, id: number) => bookmarkRepo.delete(id));

  // --- Highlights ---
  ipcMain.handle(IPC_CHANNELS.HIGHLIGHT_GET_ALL, (_, bookId: number) => highlightRepo.getByBook(bookId));
  ipcMain.handle(IPC_CHANNELS.HIGHLIGHT_ADD, (_, h: any) => highlightRepo.add(h));
  ipcMain.handle(IPC_CHANNELS.HIGHLIGHT_UPDATE, (_, id: number, updates: any) => highlightRepo.update(id, updates));
  ipcMain.handle(IPC_CHANNELS.HIGHLIGHT_DELETE, (_, id: number) => highlightRepo.delete(id));

  // --- Annotations ---
  ipcMain.handle(IPC_CHANNELS.ANNOTATION_GET_ALL, (_, bookId: number) => annotationRepo.getByBook(bookId));
  ipcMain.handle(IPC_CHANNELS.ANNOTATION_ADD, (_, a: any) => annotationRepo.add(a));
  ipcMain.handle(IPC_CHANNELS.ANNOTATION_UPDATE, (_, id: number, content: string) => annotationRepo.update(id, content));
  ipcMain.handle(IPC_CHANNELS.ANNOTATION_DELETE, (_, id: number) => annotationRepo.delete(id));

  // --- Stats ---
  ipcMain.handle(IPC_CHANNELS.STATS_GET, () => statsRepo.getStats());
  ipcMain.handle(IPC_CHANNELS.STATS_ADD_SESSION, (_, session: any) => statsRepo.addSession(session));
  ipcMain.handle(IPC_CHANNELS.STATS_GET_DAILY, (_, days: number) => statsRepo.getDailyStats(days));

  // --- Profile ---
  ipcMain.handle(IPC_CHANNELS.PROFILE_GET, () => profileRepo.get());
  ipcMain.handle(IPC_CHANNELS.PROFILE_UPDATE, (_, name: string, email: string | null, avatar: string | null) =>
    profileRepo.update(name, email, avatar)
  );
  ipcMain.handle(IPC_CHANNELS.PROFILE_UPDATE_PREFERENCES, (_, prefs: any) => profileRepo.updatePreferences(prefs));

  // --- File Operations ---
  ipcMain.handle(IPC_CHANNELS.FILE_SELECT_PDF, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select PDF File',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      properties: ['openFile', 'multiSelections']
    });
    if (result.canceled) return [];
    return result.filePaths;
  });

  ipcMain.handle(IPC_CHANNELS.FILE_SAVE_EXPORT, async (_, defaultName: string, content: string) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Export Annotations',
      defaultPath: defaultName,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'PDF', extensions: ['pdf'] }
      ]
    });
    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return result.filePath;
  });

  // --- PDF Operations ---
  ipcMain.handle(IPC_CHANNELS.PDF_OPEN, async (_, filePath: string) => {
    // Read the PDF file and return as buffer for the renderer to use with react-pdf
    const buffer = fs.readFileSync(filePath);
    return {
      buffer: buffer.buffer, // ArrayBuffer
      filePath,
      fileSize: buffer.length
    };
  });

  ipcMain.handle(IPC_CHANNELS.PDF_GET_THUMBNAIL, async (_, filePath: string) => {
    // Thumbnail generation is handled in the renderer via react-pdf
    // This returns the file path for the renderer to render the first page
    return filePath;
  });

  ipcMain.handle(IPC_CHANNELS.DB_BACKUP, async () => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Backup Database',
      defaultPath: 'ebook_reader_backup.db',
      filters: [{ name: 'Database', extensions: ['db'] }]
    });
    if (result.canceled || !result.filePath) return null;
    const { backupDatabase } = await import('../db/database');
    backupDatabase(result.filePath);
    return result.filePath;
  });

  ipcMain.handle(IPC_CHANNELS.DB_RESTORE, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Restore Database',
      filters: [{ name: 'Database', extensions: ['db'] }],
      properties: ['openFile']
    });
    if (result.canceled || result.filePaths.length === 0) return false;
    const { restoreDatabase } = await import('../db/database');
    restoreDatabase(result.filePaths[0]);
    return true;
  });
}

// ============================================================
// APP LIFECYCLE
// ============================================================

app.whenReady().then(() => {
  // Initialize database
  initDatabase();

  // Register all IPC handlers
  registerIpcHandlers();

  // Create the main window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
