'use client';

import { useMemo } from 'react';

interface ColorChipsProps {
  colors: string[];
  onColorClick?: (color: string) => void;
  className?: string;
}

export default function ColorChips({ colors, onColorClick, className }: ColorChipsProps) {
  const swatches = useMemo(() => {
    if (!colors || colors.length === 0) return [];
    const items = colors.slice(0, 6).map((c, i) => ({ color: c, key: `${c}-${i}` }));
    while (items.length < 3) items.push({ color: '#e5e7eb', key: `placeholder-${items.length}` });
    return items;
  }, [colors]);

  if (!colors || colors.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <div className="text-4xl mb-2">🎨</div>
        <p>No color data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <div className="flex flex-wrap gap-3">
        {swatches.map((s) => (
          <button
            key={s.key}
            className="relative group"
            onClick={() => onColorClick && onColorClick(s.color)}
            disabled={!onColorClick}
          >
            <div
              className="w-16 h-16 rounded-xl shadow-md border border-black/5 transition-transform duration-200 hover:scale-110 active:scale-95"
              style={{ backgroundColor: s.color }}
            />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-600">
              {s.color}
            </div>
          </button>
        ))}
      </div>
      {/* Simple fun interaction */}
      <div className="text-center text-sm text-gray-600">
        {onColorClick ? 'Tap colors to explore!' : 'Tip: Tap the image again to try finding new colors!'}
      </div>
    </div>
  );
}
