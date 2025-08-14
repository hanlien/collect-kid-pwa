'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Paw print SVG component
export const PawPrint: React.FC<{ className?: string; animate?: boolean }> = ({ 
  className = "w-6 h-6", 
  animate = false 
}) => (
  <motion.svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    animate={animate ? { rotate: [0, 10, -10, 0] } : {}}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  >
    <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 8c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm6 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
  </motion.svg>
);

// Leaf SVG component
export const Leaf: React.FC<{ className?: string; animate?: boolean }> = ({ 
  className = "w-6 h-6", 
  animate = false 
}) => (
  <motion.svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    animate={animate ? { rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] } : {}}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.19 0 2.34-.21 3.41-.6.3-.11.49-.4.49-.72 0-.43-.35-.78-.78-.78-.26 0-.5.13-.64.34-.8.26-1.65.4-2.52.4-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8c0 .87-.14 1.72-.4 2.52-.21.14-.34.38-.34.64 0 .43.35.78.78.78.32 0 .61-.19.72-.49.39-1.07.6-2.22.6-3.41C22 6.48 17.52 2 12 2z"/>
  </motion.svg>
);

// Butterfly SVG component
export const Butterfly: React.FC<{ className?: string; animate?: boolean }> = ({ 
  className = "w-8 h-8", 
  animate = false 
}) => (
  <motion.svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    animate={animate ? { 
      y: [0, -10, 0],
      rotateZ: [0, 5, -5, 0]
    } : {}}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  >
    <path d="M12 2c-.5 0-1 .2-1.4.6L8.5 4.7c-.8.8-.8 2.1 0 2.9.8.8 2.1.8 2.9 0l.6-.6.6.6c.8.8 2.1.8 2.9 0 .8-.8.8-2.1 0-2.9L13.4 2.6c-.4-.4-.9-.6-1.4-.6zm-6 8c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H6zm8 0c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2h-2z"/>
  </motion.svg>
);

// Flower SVG component
export const Flower: React.FC<{ className?: string; animate?: boolean }> = ({ 
  className = "w-6 h-6", 
  animate = false 
}) => (
  <motion.svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    animate={animate ? { rotate: [0, 360] } : {}}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
  >
    <path d="M12 2C9.24 2 7 4.24 7 7c0 1.12.37 2.16 1 3C7.37 9.16 7 8.12 7 7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.12-.37 2.16-1 3 .63-.84 1-1.88 1-3 0-2.76-2.24-5-5-5z"/>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
  </motion.svg>
);

// Animal silhouettes for backgrounds
export const AnimalSilhouettes: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg className={className} viewBox="0 0 400 200" fill="none">
    <defs>
      <pattern id="animalPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <g opacity="0.05" fill="currentColor">
          {/* Butterfly silhouette */}
          <path d="M25 20c0-3 2-5 5-5s5 2 5 5-2 5-5 5-5-2-5-5zm10 0c0-3 2-5 5-5s5 2 5 5-2 5-5 5-5-2-5-5zm-15 15c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5-1.5 3.5-3.5 3.5-3.5-1.5-3.5-3.5zm15 0c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5-1.5 3.5-3.5 3.5-3.5-1.5-3.5-3.5z"/>
          
          {/* Leaf silhouette */}
          <path d="M70 25c5-5 15-5 15 5s-5 15-15 10c-5-2.5-5-7.5 0-15z"/>
          
          {/* Flower silhouette */}
          <circle cx="20" cy="70" r="3"/>
          <circle cx="25" cy="65" r="2"/>
          <circle cx="15" cy="65" r="2"/>
          <circle cx="25" cy="75" r="2"/>
          <circle cx="15" cy="75" r="2"/>
          
          {/* Paw prints */}
          <g transform="translate(60,60)">
            <circle cx="0" cy="0" r="1.5"/>
            <circle cx="3" cy="-2" r="1"/>
            <circle cx="-3" cy="-2" r="1"/>
            <circle cx="0" cy="-4" r="1"/>
          </g>
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#animalPattern)"/>
  </svg>
);

// Nature border component
export const NatureBorder: React.FC<{ position?: 'top' | 'bottom' | 'left' | 'right'; className?: string }> = ({ 
  position = 'top',
  className = ""
}) => {
  const elements = Array.from({ length: 8 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute text-primary-300"
      style={{
        [position === 'top' || position === 'bottom' ? 'left' : 'top']: `${(i + 1) * 12.5}%`,
        [position]: '0',
        transform: position === 'top' || position === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)'
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: i * 0.1, duration: 0.5 }}
    >
      {i % 4 === 0 && <PawPrint className="w-3 h-3" animate />}
      {i % 4 === 1 && <Leaf className="w-3 h-3" animate />}
      {i % 4 === 2 && <Flower className="w-3 h-3" animate />}
      {i % 4 === 3 && <Butterfly className="w-4 h-4" animate />}
    </motion.div>
  ));

  return (
    <div className={`absolute ${position === 'top' ? 'top-0' : position === 'bottom' ? 'bottom-0' : position === 'left' ? 'left-0' : 'right-0'} ${className}`}>
      {elements}
    </div>
  );
};

// Floating nature elements
export const FloatingElements: React.FC<{ count?: number; className?: string }> = ({ 
  count = 6,
  className = ""
}) => {
  const elements = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      className={`absolute text-primary-200 ${className}`}
      style={{
        left: `${Math.random() * 90 + 5}%`,
        top: `${Math.random() * 90 + 5}%`,
      }}
      animate={{
        y: [0, -20, 0],
        rotate: [0, 10, -10, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 2,
      }}
    >
      {i % 4 === 0 && <PawPrint className="w-4 h-4" />}
      {i % 4 === 1 && <Leaf className="w-4 h-4" />}
      {i % 4 === 2 && <Flower className="w-4 h-4" />}
      {i % 4 === 3 && <Butterfly className="w-5 h-5" />}
    </motion.div>
  ));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {elements}
    </div>
  );
};
