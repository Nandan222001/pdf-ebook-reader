// src/main/preload.ts
// Preload script — exposes a secure API bridge between main and renderer

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';

// Type-safe API exposed to the renderer process
const api = {
  // Library
  library: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_GET_ALL),
    getOne: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_GET_ONE, id),
    add: (book: any) => ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_ADD, book),
    update: (id: number, updates: any) => ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_UPDATE, id, updates),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_DELETE, id),
    toggleFavorite: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_TOGGLE_FAVORITE, id),
    updateProgress: (id: number, page: number, pageCount: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_UPDATE_PROGRESS, id, page, pageCount),
    search: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_SEARCH, query),
  },

  // Bookmarks
  bookmarks: {
    getAll: (bookId: number) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_GET_ALL, bookId),
    add: (bookId: number, page: number, title: string, note: string | null) =>
      ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_ADD, bookId, page, title, note),
    update: (id: number, title: string, note: string | null) =>
      ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_UPDATE, id, title, note),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_DELETE, id),
  },

  // Highlights
  highlights: {
    getAll: (bookId: number) => ipcRenderer.invoke(IPC_CHANNELS.HIGHLIGHT_GET_ALL, bookId),
    add: (h: any) => ipcRenderer.invoke(IPC_CHANNELS.HIGHLIGHT_ADD, h),
    update: (id: number, updates: any) => ipcRenderer.invoke(IPC_CHANNELS.HIGHLIGHT_UPDATE, id, updates),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.HIGHLIGHT_DELETE, id),
  },

  // Annotations
  annotations: {
    getAll: (bookId: number) => ipcRenderer.invoke(IPC_CHANNELS.ANNOTATION_GET_ALL, bookId),
    add: (a: any) => ipcRenderer.invoke(IPC_CHANNELS.ANNOTATION_ADD, a),
    update: (id: number, content: string) => ipcRenderer.invoke(IPC_CHANNELS.ANNOTATION_UPDATE, id, content),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.ANNOTATION_DELETE, id),
  },

  // Stats
  stats: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.STATS_GET),
    addSession: (session: any) => ipcRenderer.invoke(IPC_CHANNELS.STATS_ADD_SESSION, session),
    getDaily: (days: number) => ipcRenderer.invoke(IPC_CHANNELS.STATS_GET_DAILY, days),
  },

  // Profile
  profile: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.PROFILE_GET),
    update: (name: string, email: string | null, avatar: string | null) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_UPDATE, name, email, avatar),
    updatePreferences: (prefs: any) => ipcRenderer.invoke(IPC_CHANNELS.PROFILE_UPDATE_PREFERENCES, prefs),
  },

  // PDF Operations
  pdf: {
    open: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.PDF_OPEN, filePath),
    getThumbnail: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.PDF_GET_THUMBNAIL, filePath),
  },

  // File Operations
  file: {
    selectPdf: () => ipcRenderer.invoke(IPC_CHANNELS.FILE_SELECT_PDF),
    saveExport: (defaultName: string, content: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FILE_SAVE_EXPORT, defaultName, content),
  },

  // Database
  db: {
    backup: () => ipcRenderer.invoke(IPC_CHANNELS.DB_BACKUP),
    restore: () => ipcRenderer.invoke(IPC_CHANNELS.DB_RESTORE),
  },
};

// Expose the API to the renderer process via contextBridge
contextBridge.exposeInMainWorld('electronAPI', api);

// Type declaration for the renderer
export type ElectronAPI = typeof api;
