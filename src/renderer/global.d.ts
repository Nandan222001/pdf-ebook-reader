// src/renderer/global.d.ts
// Global type declarations for the renderer process

import type { ElectronAPI } from '../main/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
