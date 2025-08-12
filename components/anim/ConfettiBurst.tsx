import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiBurstProps {
  trigger: boolean;
  colors?: string[];
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
}

export function ConfettiBurst({ 
  trigger, 
  colors = ['#4ade80', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'],
  particleCount = 100,
  spread = 70,
  startVelocity = 30
}: ConfettiBurstProps) {
  useEffect(() => {
    if (trigger) {
      // Multiple bursts for more dramatic effect
      confetti({
        particleCount,
        spread,
        startVelocity,
        colors,
        origin: { y: 0.6 }
      });
      
      // Second burst after a delay
      setTimeout(() => {
        confetti({
          particleCount: particleCount / 2,
          spread: spread * 1.5,
          startVelocity: startVelocity * 0.8,
          colors,
          origin: { y: 0.7, x: 0.3 }
        });
      }, 200);
      
      // Third burst
      setTimeout(() => {
        confetti({
          particleCount: particleCount / 2,
          spread: spread * 1.5,
          startVelocity: startVelocity * 0.8,
          colors,
          origin: { y: 0.7, x: 0.7 }
        });
      }, 400);
    }
  }, [trigger, colors, particleCount, spread, startVelocity]);

  return null; // This component doesn't render anything
}
