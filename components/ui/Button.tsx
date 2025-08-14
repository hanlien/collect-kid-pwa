'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-500 text-white shadow-lg hover:bg-primary-600 hover:shadow-xl',
          'focus-visible:ring-primary-500',
          'active:bg-primary-700 active:scale-95',
          'before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary-400 before:to-primary-600 before:opacity-0 hover:before:opacity-100 before:transition-opacity'
        ],
        secondary: [
          'bg-secondary-500 text-white shadow-lg hover:bg-secondary-600 hover:shadow-xl',
          'focus-visible:ring-secondary-500',
          'active:bg-secondary-700 active:scale-95'
        ],
        accent: [
          'bg-accent-500 text-white shadow-lg hover:bg-accent-600 hover:shadow-xl',
          'focus-visible:ring-accent-500',
          'active:bg-accent-700 active:scale-95',
          'shadow-glow-accent hover:shadow-glow-accent'
        ],
        outline: [
          'border-2 border-primary-500 text-primary-600 bg-transparent hover:bg-primary-50',
          'focus-visible:ring-primary-500',
          'active:bg-primary-100'
        ],
        ghost: [
          'text-primary-600 bg-transparent hover:bg-primary-50 hover:text-primary-700',
          'focus-visible:ring-primary-500'
        ],
        danger: [
          'bg-error-500 text-white shadow-lg hover:bg-error-600 hover:shadow-xl',
          'focus-visible:ring-error-500',
          'active:bg-error-700 active:scale-95'
        ],
        success: [
          'bg-success-500 text-white shadow-lg hover:bg-success-600 hover:shadow-xl',
          'focus-visible:ring-success-500',
          'active:bg-success-700 active:scale-95',
          'shadow-nature hover:animate-nature-glow'
        ],
        nature: [
          'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-paw',
          'hover:from-green-600 hover:to-green-700 hover:shadow-nature',
          'focus-visible:ring-green-500',
          'active:scale-95',
          'relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-400/20 before:to-green-500/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity'
        ]
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-base rounded-lg',
        lg: 'h-12 px-6 text-lg rounded-xl',
        xl: 'h-14 px-8 text-xl rounded-2xl',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-xl'
      },
      animation: {
        none: '',
        bounce: 'hover:animate-paw-bounce',
        float: 'hover:animate-float',
        wiggle: 'hover:animate-wiggle',
        sparkle: 'hover:animate-sparkle'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      animation: 'none'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation, 
    asChild = false, 
    loading = false,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    const buttonContent = (
      <>
        {leftIcon && (
          <span className={cn('flex-shrink-0', loading && 'opacity-0')}>
            {leftIcon}
          </span>
        )}
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        
        <span className={cn('relative z-10', loading && 'opacity-0')}>
          {children}
        </span>
        
        {rightIcon && (
          <span className={cn('flex-shrink-0', loading && 'opacity-0')}>
            {rightIcon}
          </span>
        )}
      </>
    );

    if (asChild) {
      return (
        <span className={cn(buttonVariants({ variant, size, animation, className }))}>
          {buttonContent}
        </span>
      );
    }

    return (
      // @ts-ignore - exactOptionalPropertyTypes conflict with framer-motion
      <motion.button
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={isDisabled}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {buttonContent}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
