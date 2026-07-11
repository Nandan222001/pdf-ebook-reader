// src/renderer/views/SettingsView.tsx
// Settings page — profile, themes, reading preferences, data management

import { useState } from 'react';
import { User, Palette, Volume2, BookOpen, Database, Save, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import type { ThemeName } from '../../shared/types';

export default function SettingsView() {
  const { profile, theme, setTheme, updatePreferences } = useStore();
  const [name, setName] = useState(profile?.name ?? 'Reader');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [savedMessage, setSavedMessage] = useState(false);

  if (!profile) return null;

  const prefs = profile.preferences;

  const handleSaveProfile = () => {
    window.electronAPI.profile.update(name, email || null, null);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const themes: { id: ThemeName; label: string; preview: string }[] = [
    { id: 'dark', label: 'Dark', preview: 'bg-[#1a1a2e]' },
    { id: 'light', label: 'Light', preview: 'bg-[#f7f7f5]' },
    { id: 'sepia', label: 'Sepia', preview: 'bg-[#f4e9d2]' },
    { id: 'parchment', label: 'Parchment', preview: 'bg-[#eee4cc]' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-book-bg p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-book-text">Settings</h1>
          <p className="text-book-muted mt-1">Customize your reading experience</p>
        </div>

        {/* Profile section */}
        <Section icon={User} title="Profile">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-book-text mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-book-text mb-1.5">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@example.com"
                className="input"
              />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSaveProfile} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Profile
              </button>
              {savedMessage && (
                <span className="text-sm text-emerald-400 animate-fade-in">Saved!</span>
              )}
            </div>
          </div>
        </Section>

        {/* Theme section */}
        <Section icon={Palette} title="Appearance">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  'card p-4 text-center transition-all',
                  theme === t.id ? 'ring-2 ring-book-accent' : 'hover:border-book-accent/50'
                )}
              >
                <div className={cn('w-full h-16 rounded-lg mb-2', t.preview)} />
                <span className="text-sm font-medium text-book-text">{t.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Reading preferences */}
        <Section icon={BookOpen} title="Reading Preferences">
          <div className="space-y-4">
            {/* Default view mode */}
            <div>
              <label className="block text-sm font-medium text-book-text mb-2">Default View Mode</label>
              <div className="flex gap-2">
                {(['single', 'spread'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updatePreferences({ defaultView: mode })}
                    className={cn(
                      'btn flex-1 capitalize',
                      prefs.defaultView === mode ? 'bg-book-accent text-white' : 'bg-book-surface text-book-text'
                    )}
                  >
                    {mode === 'single' ? 'Single Page' : 'Two-Page Spread'}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className="block text-sm font-medium text-book-text mb-2">
                Font Size: {prefs.fontSize}px
              </label>
              <input
                type="range"
                min={12}
                max={24}
                value={prefs.fontSize}
                onChange={(e) => updatePreferences({ fontSize: Number(e.target.value) })}
                className="w-full accent-book-accent"
              />
            </div>

            {/* Auto-save interval */}
            <div>
              <label className="block text-sm font-medium text-book-text mb-2">
                Auto-save Interval: {prefs.autoSaveInterval}s
              </label>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={prefs.autoSaveInterval}
                onChange={(e) => updatePreferences({ autoSaveInterval: Number(e.target.value) })}
                className="w-full accent-book-accent"
              />
            </div>

            {/* Show page numbers */}
            <ToggleRow
              label="Show Page Numbers"
              value={prefs.showPageNumbers}
              onChange={(v) => updatePreferences({ showPageNumbers: v })}
            />

            {/* Keyboard shortcuts */}
            <ToggleRow
              label="Enable Keyboard Shortcuts"
              value={prefs.keyboardShortcuts}
              onChange={(v) => updatePreferences({ keyboardShortcuts: v })}
            />
          </div>
        </Section>

        {/* Sound settings */}
        <Section icon={Volume2} title="Sound">
          <div className="space-y-4">
            <ToggleRow
              label="Page-Turn Sound"
              value={prefs.pageFlipSound}
              onChange={(v) => updatePreferences({ pageFlipSound: v })}
            />
            <div>
              <label className="block text-sm font-medium text-book-text mb-2">
                Sound Volume: {Math.round(prefs.soundVolume * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={prefs.soundVolume}
                onChange={(e) => updatePreferences({ soundVolume: Number(e.target.value) })}
                className="w-full accent-book-accent"
              />
            </div>
          </div>
        </Section>

        {/* Data management */}
        <Section icon={Database} title="Data Management">
          <div className="space-y-3">
            <p className="text-sm text-book-muted">
              Your data is stored locally in a SQLite database. Back it up regularly.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.electronAPI.db.backup()}
                className="btn-primary flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Backup Database
              </button>
              <button
                onClick={() => {
                  if (confirm('Restore database from backup? This will replace all current data.')) {
                    window.electronAPI.db.restore().then((success: boolean) => {
                      if (success) {
                        alert('Database restored! Please restart the app.');
                      }
                    });
                  }
                }}
                className="btn-ghost flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restore from Backup
              </button>
            </div>
          </div>
        </Section>

        {/* About */}
        <div className="text-center py-6">
          <p className="text-sm text-book-muted">
            PDF eBook Reader v1.0.0 · Built with Electron + React + TypeScript
          </p>
        </div>
      </div>
    </div>
  );
}

// Reusable section wrapper
function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-book-accent" />
        <h2 className="font-display text-lg font-semibold text-book-text">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// Reusable toggle row
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-book-text">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          value ? 'bg-book-accent' : 'bg-book-border'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
