// src/renderer/views/StatsView.tsx
// Reading statistics dashboard — time spent, pages read, streaks, daily chart

import { useMemo } from 'react';
import { BookOpen, Clock, Flame, TrendingUp, Calendar, Award } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDuration, cn } from '../lib/utils';

export default function StatsView() {
  const { stats, books } = useStore();

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-book-muted">Loading statistics...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Books',
      value: stats.totalBooks.toString(),
      icon: BookOpen,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Pages Read',
      value: stats.totalPagesRead.toLocaleString(),
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Time Spent',
      value: formatDuration(stats.totalTimeSpent),
      icon: Clock,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: Flame,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
  ];

  // Calculate max for chart scaling
  const maxPages = Math.max(...stats.dailyStats.map((d) => d.pagesRead), 1);
  const maxTime = Math.max(...stats.dailyStats.map((d) => d.timeSpent), 1);

  // Top books by progress
  const topBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5)
      .filter((b) => b.progress > 0);
  }, [books]);

  return (
    <div className="h-full overflow-y-auto bg-book-bg p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-book-text">Reading Statistics</h1>
          <p className="text-book-muted mt-1">Track your reading progress and habits</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-5 animate-slide-up">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', stat.bg)}>
                  <Icon className={cn('w-5 h-5', stat.color)} />
                </div>
                <p className="text-2xl font-bold text-book-text tabular-nums">{stat.value}</p>
                <p className="text-sm text-book-muted mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Streak info */}
        <div className="card p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-7 h-7 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold text-book-text">Reading Streak</h3>
              <p className="text-book-muted text-sm mt-0.5">
                Current: <span className="text-book-text font-medium">{stats.currentStreak} days</span>
                {' · '}
                Longest: <span className="text-book-text font-medium">{stats.longestStreak} days</span>
                {' · '}
                Last read: <span className="text-book-text font-medium">{stats.lastReadDate || 'Never'}</span>
              </p>
            </div>
            {stats.currentStreak > 0 && (
              <div className="flex items-center gap-1 text-orange-400">
                <Award className="w-5 h-5" />
                <span className="text-sm font-medium">On fire!</span>
              </div>
            )}
          </div>
        </div>

        {/* Daily activity chart */}
        <div className="card p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-book-muted" />
            <h3 className="font-display text-lg font-semibold text-book-text">Daily Activity (Last 30 Days)</h3>
          </div>

          {stats.dailyStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-10 h-10 text-book-muted mb-3" strokeWidth={1.5} />
              <p className="text-book-muted">No reading activity yet. Start reading to see your stats here!</p>
            </div>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {stats.dailyStats.map((day) => {
                const heightPct = (day.pagesRead / maxPages) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1 group"
                    title={`${day.date}: ${day.pagesRead} pages, ${formatDuration(day.timeSpent)}`}
                  >
                    <div
                      className="w-full bg-book-accent/60 rounded-t group-hover:bg-book-accent transition-colors"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                    <span className="text-xs text-book-muted opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.pagesRead}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top books by progress */}
        {topBooks.length > 0 && (
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold text-book-text mb-4">Most Read Books</h3>
            <div className="space-y-3">
              {topBooks.map((book, idx) => (
                <div key={book.id} className="flex items-center gap-3">
                  <span className="text-book-muted text-sm w-6 tabular-nums">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-book-text truncate">{book.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${book.progress}%` }} />
                      </div>
                      <span className="text-xs text-book-muted tabular-nums">{Math.round(book.progress)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
