'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Lazy load Confetti component (only needed on success)
const Confetti = dynamic(() => import('@/components/Confetti'), {
  loading: () => null, // No loading state needed for confetti
  ssr: false
});

export default function LazyConfetti(props: ComponentProps<typeof Confetti>) {
  return <Confetti {...props} />;
}
