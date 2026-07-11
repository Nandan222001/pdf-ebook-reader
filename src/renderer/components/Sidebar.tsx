// src/renderer/components/Sidebar.tsx
// Navigation sidebar for the app

import { Library, BarChart3, Settings, BookOpen, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import type { ViewName } from '../App';

interface SidebarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { profile, stats, books } = useStore();

  const navItems = [
    { id: 'library' as ViewName, label: 'Library', icon: Library, badge: books.length },
    { id: 'stats' as ViewName, label: 'Statistics', icon: BarChart3, badge: null },
    { id: 'settings' as ViewName, label: 'Settings', icon: Settings, badge: null },
  ];

  const favoriteCount = books.filter((b) => b.is_favorite).length;

  return (
    <aside className="w-64 flex-shrink-0 bg-book-surface border-r border-book-border flex flex-col">
      {/* Logo / App Name */}
      <div className="px-6 py-5 border-b border-book-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-book-accent to-purple-700 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-book-text leading-tight">
              Lector
            </h1>
            <p className="text-xs text-book-muted">PDF eBook Reader</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'sidebar-item w-full text-left',
                isActive && 'active'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.8} />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {item.badge !== null && item.badge > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-book-border text-book-muted">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Favorites shortcut */}
        <div className="pt-3 mt-3 border-t border-book-border">
          <div className="px-4 py-2 flex items-center gap-2 text-xs text-book-muted uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5" />
            <span>Favorites</span>
            <span className="ml-auto">{favoriteCount}</span>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-book-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-book-accent to-purple-700 flex items-center justify-center text-white text-sm font-semibold">
            {profile?.name?.charAt(0).toUpperCase() ?? 'R'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-book-text truncate">
              {profile?.name ?? 'Reader'}
            </p>
            <p className="text-xs text-book-muted truncate">
              {stats ? `${stats.totalPagesRead} pages read` : 'Welcome!'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
