'use client';

import { useMemo } from 'react';

interface ColorChipsProps {
  colors: string[];
}

export default function ColorChips({ colors }: ColorChipsProps) {
  const swatches = useMemo(() => {
    const items = colors.slice(0, 6).map((c, i) => ({ color: c, key: `${c}-${i}` }));
    while (items.length < 3) items.push({ color: '#e5e7eb', key: `placeholder-${items.length}` });
    return items;
  }, [colors]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {swatches.map((s, i) => (
          <div key={s.key} className="relative">
            <div
              className="w-16 h-16 rounded-xl shadow-md border border-black/5"
              style={{ backgroundColor: s.color }}
            />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-600">
              {s.color}
            </div>
          </div>
        ))}
      </div>
      {/* Simple fun interaction */}
      <div className="text-center text-sm text-gray-600">
        Tip: Tap the image again to try finding new colors!
      </div>
    </div>
  );
}

'use client';

interface ColorChipsProps {
  colors: string[];
  className?: string;
}

export default function ColorChips({ colors, className = '' }: ColorChipsProps) {
  if (!colors || colors.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-600 mr-2">Colors:</span>
      {colors.slice(0, 5).map((color, index) => (
        <div
          key={index}
          className="w-6 h-6 rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
}
