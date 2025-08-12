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
