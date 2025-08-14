'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
  className?: string;
}

export default function Confetti({ trigger, className = '' }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (trigger && canvasRef.current) {
      const myConfetti = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true,
      });

      // Fire confetti
      myConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ec4899'],
      });

      // Cleanup
      const timer = setTimeout(() => {
        myConfetti.reset();
      }, 3000);

      return () => {
        clearTimeout(timer);
        myConfetti.reset();
      };
    }
    return undefined;
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-50 ${className}`}
    />
  );
}
