'use client';

import { ReactNode } from 'react';

interface BigButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function BigButton({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  className = '',
}: BigButtonProps) {
  const handleClick = () => {
    // Haptic feedback (vibrate if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onClick();
  };

  const baseClasses = 'font-bold rounded-full shadow-lg transform transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-500 hover:text-white',
  };

  const sizeClasses = {
    sm: 'py-2 px-4 text-sm min-h-[48px]',
    md: 'py-3 px-6 text-base min-h-[56px]',
    lg: 'py-4 px-8 text-lg min-h-[64px]',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}
