'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Lazy load ProfileSelector component
const ProfileSelector = dynamic(() => import('@/components/ProfileSelector'), {
  loading: () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  ssr: false
});

export default function LazyProfileSelector(props: ComponentProps<typeof ProfileSelector>) {
  return <ProfileSelector {...props} />;
}
