# 📖 PDF eBook Reader

A beautiful, production-ready cross-platform desktop PDF e-book reader with a realistic book-like UI/UX, powerful local annotations, and SQLite persistence.

> Built with Electron + React + TypeScript + Vite + Tailwind CSS + SQLite

![Tech Stack](https://img.shields.io/badge/Electron-31-blue) ![React](https://img.shields.io/badge/React-18-cyan) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-teal) ![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-green)

## ✨ Features

### 📚 Library
- **Grid/shelf view** of all books with covers, progress bars, and hover effects
- **Drag & drop** PDF import + file picker button
- **Search** by title or author
- **Filters**: All books, Recently Read, Favorites
- **Auto-generated cover gradients** for books without thumbnails
- **Book context menu**: toggle favorite, delete

### 📖 Reading Mode
- **Full immersive view** with auto-hiding toolbar
- **Single page & two-page spread** toggle (like an open book)
- **Smooth page navigation** with keyboard (←/→, Space, Esc), on-screen buttons, and page input
- **Zoom controls** (50%–300%) with fit-to-width
- **4 themes**: Dark, Light, Sepia, Parchment
- **Page-turn sound** (synthesized via Web Audio API, toggleable)
- **Progress bar** at bottom with page count and percentage
- **Table of Contents** (parsed from PDF outline when available)

### 📑 Annotations
- **Bookmarks**: Add/remove with custom title and note. Jump to any bookmark.
- **Highlights**: Select text → choose from 5 colors → add optional notes. Persistent across sessions.
- **Notes**: Page-specific typed notes with sticky note panel.
- **Search**: Search through highlights and notes within the current book.
- **Export**: Export all annotations as Markdown or JSON.

### 📊 Statistics
- Total books, pages read, time spent
- **Reading streaks** (current and longest)
- **Daily activity chart** (last 30 days)
- Top books by progress

### ⚙️ Settings
- User profile (name, email)
- Theme selection with live preview
- Font size, auto-save interval, default view mode
- Sound settings (toggle + volume)
- **Database backup & restore**
- All preferences persisted in SQLite

### 🔒 Privacy & Offline
- **100% offline** — all data stored locally in SQLite
- No cloud, no telemetry, no accounts
- Your books never leave your device

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Native build tools for `better-sqlite3` (Xcode CLI tools on macOS, Visual Studio Build Tools on Windows, build-essential on Linux)

### Installation

```bash
# Clone the repository
git clone https://github.com/Nandan222001/pdf-ebook-reader.git
cd pdf-ebook-reader

# Install dependencies
npm install

# Start development mode
npm run electron:dev
```

### Development Commands

```bash
npm run dev              # Start Vite dev server only
npm run electron:dev     # Start Electron + Vite together (recommended)
npm run typecheck        # Type-check without building
npm run lint             # Run ESLint
```

### Building for Production

```bash
# Build the app and package it for your current platform
npm run electron:build

# Build without packaging (faster, for testing)
npm run build:dir
```

The packaged app will be in the `release/` directory.

### Packaging for All Platforms

The `electron-builder` config in `package.json` supports:
- **macOS**: DMG + ZIP
- **Windows**: NSIS installer + portable
- **Linux**: AppImage + DEB

To build for a specific platform:
```bash
npm run electron:build -- --mac
npm run electron:build -- --win
npm run electron:build -- --linux
```

## 🏗️ Architecture

### Project Structure
```
pdf-ebook-reader/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Main process entry, window & IPC handlers
│   │   └── preload.ts           # Secure IPC bridge (contextBridge)
│   ├── renderer/                # React renderer process
│   │   ├── App.tsx              # Root component, view routing
│   │   ├── main.tsx             # React entry point
│   │   ├── index.css            # Global styles + theme variables
│   │   ├── global.d.ts          # Window.electronAPI type declaration
│   │   ├── lib/
│   │   │   └── utils.ts         # Utilities (cn, formatters, page-turn sound)
│   │   ├── store/
│   │   │   └── useStore.ts      # Zustand global state
│   │   ├── components/
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── LoadingScreen.tsx    # Init loading screen
│   │   │   ├── BookCard.tsx         # Library book card
│   │   │   ├── ReaderSidebar.tsx    # Reader annotation sidebar
│   │   │   └── HighlightPopup.tsx   # Text selection highlight popup
│   │   └── views/
│   │       ├── LibraryView.tsx      # Library/home screen
│   │       ├── ReaderView.tsx       # PDF reading mode
│   │       ├── StatsView.tsx        # Reading statistics
│   │       └── SettingsView.tsx     # Settings page
│   ├── db/                      # SQLite database layer
│   │   ├── schema.ts            # Schema definition + migrations
│   │   ├── database.ts          # Connection management
│   │   └── repositories.ts      # CRUD operations for all entities
│   └── shared/
│       └── types.ts             # Shared TypeScript types + IPC channels
├── index.html                   # HTML entry with Google Fonts
├── vite.config.ts               # Vite + Electron plugin config
├── tailwind.config.js           # Tailwind with book-themed colors
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

### Database Schema

The SQLite database (`ebook_reader.db`) is stored in the Electron `userData` directory and contains:

| Table | Purpose |
|-------|---------|
| `user_profile` | User name, email, preferences (JSON) |
| `books` | Library of PDFs with metadata, progress, favorites |
| `bookmarks` | Page-level bookmarks with title and note |
| `highlights` | Text highlights with color and optional note |
| `annotations` | Page-specific notes, sticky notes, drawings |
| `reading_sessions` | Individual reading session tracking |
| `reading_streaks` | Daily reading streak data |

### IPC Architecture

The app uses Electron's `contextBridge` for secure IPC communication:

```
Renderer (React)  ←→  preload.ts (contextBridge)  ←→  main/index.ts (ipcMain.handle)  ←→  SQLite
```

All database operations go through typed IPC channels defined in `src/shared/types.ts`.

### Security Considerations

- **contextIsolation: true** — renderer has no direct Node.js access
- **nodeIntegration: false** — no require() in renderer
- **Content Security Policy** — restricts script/style/font/image sources
- **Sandboxed preload** — minimal API surface exposed to renderer
- **External links** open in system browser, not Electron

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `←` / `→` | Previous / Next page |
| `Space` | Next page |
| `Esc` | Exit reading mode |
| `Ctrl/Cmd + B` | Toggle bookmark |
| `Ctrl/Cmd + F` | Open search sidebar |

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Electron 31 | Cross-platform desktop shell |
| React 18 | UI framework |
| TypeScript 5.5 | Type safety |
| Vite 5 | Build tool + dev server |
| Tailwind CSS 3.4 | Styling |
| better-sqlite3 | SQLite database |
| react-pdf (pdf.js) | PDF rendering |
| react-pageflip | Page-flip animation |
| pdf-lib | PDF manipulation |
| Zustand | State management |
| lucide-react | Icons |

## 📝 License

MIT © Nandan222001
