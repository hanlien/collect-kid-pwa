'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Lazy load BadgePopup component with loading placeholder
const BadgePopup = dynamic(() => import('@/components/BadgePopup'), {
  loading: () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-20 bg-gray-200 rounded mb-4"></div>
        <div className="h-6 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  ssr: false
});

export default function LazyBadgePopup(props: ComponentProps<typeof BadgePopup>) {
  return <BadgePopup {...props} />;
}
