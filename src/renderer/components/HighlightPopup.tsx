// src/renderer/components/HighlightPopup.tsx
// Floating popup that appears when text is selected — lets user choose highlight color

import { useEffect, useRef, useState } from 'react';
import { Highlighter, MessageSquarePlus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { HighlightColor } from '../../shared/types';

interface HighlightPopupProps {
  selectedText: { text: string; rect: DOMRect };
  onHighlight: (color: HighlightColor) => void;
  onClose: () => void;
}

const COLORS: { color: HighlightColor; bg: string; label: string }[] = [
  { color: 'yellow', bg: 'bg-yellow-400', label: 'Yellow' },
  { color: 'green', bg: 'bg-green-500', label: 'Green' },
  { color: 'blue', bg: 'bg-blue-500', label: 'Blue' },
  { color: 'pink', bg: 'bg-pink-500', label: 'Pink' },
  { color: 'orange', bg: 'bg-orange-500', label: 'Orange' },
];

export default function HighlightPopup({ selectedText, onHighlight, onClose }: HighlightPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Position the popup near the selection
  useEffect(() => {
    const rect = selectedText.rect;
    const popupWidth = 280;
    const popupHeight = 50;

    let left = rect.left + rect.width / 2 - popupWidth / 2;
    let top = rect.top - popupHeight - 10;

    // Keep popup within viewport
    left = Math.max(10, Math.min(left, window.innerWidth - popupWidth - 10));
    if (top < 10) top = rect.bottom + 10;

    setPosition({ top, left });
  }, [selectedText]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close from the selection event
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  const handleHighlight = (color: HighlightColor) => {
    onHighlight(color);
    setNoteText('');
    setShowNoteInput(false);
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-50 animate-slide-up"
      style={{ top: position.top, left: position.left }}
    >
      <div className="card shadow-2xl p-2 w-72">
        {!showNoteInput ? (
          <div className="flex items-center gap-2">
            <Highlighter className="w-4 h-4 text-book-muted flex-shrink-0" />
            <div className="flex items-center gap-1.5 flex-1">
              {COLORS.map(({ color, bg, label }) => (
                <button
                  key={color}
                  onClick={() => handleHighlight(color)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-transform hover:scale-125',
                    bg,
                    'ring-2 ring-transparent hover:ring-book-text/20'
                  )}
                  title={label}
                />
              ))}
            </div>
            <div className="w-px h-6 bg-book-border" />
            <button
              onClick={() => setShowNoteInput(true)}
              className="btn-ghost p-1.5"
              title="Add Note"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="btn-ghost p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note to this highlight..."
              className="input text-sm resize-none"
              rows={2}
            />
            <div className="flex items-center gap-2">
              {COLORS.map(({ color, bg }) => (
                <button
                  key={color}
                  onClick={() => handleHighlight(color)}
                  className={cn('w-6 h-6 rounded-full hover:scale-110 transition-transform', bg)}
                />
              ))}
              <button
                onClick={() => setShowNoteInput(false)}
                className="btn-ghost text-xs ml-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
