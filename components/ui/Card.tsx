'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl bg-white shadow-lg border border-neutral-200 overflow-hidden relative',
  {
    variants: {
      variant: {
        default: 'bg-white shadow-md',
        elevated: 'bg-white shadow-xl',
        nature: [
          'bg-gradient-to-br from-primary-50 to-secondary-50',
          'border-primary-200 shadow-nature',
          'before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-100/20 before:to-secondary-100/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity'
        ],
        discovery: [
          'bg-gradient-to-br from-accent-50 to-warning-50',
          'border-accent-200 shadow-candy',
          'hover:shadow-candy-lg transition-shadow duration-300'
        ],
        glass: [
          'bg-white/80 backdrop-blur-sm shadow-xl',
          'border-white/20',
          'hover:bg-white/90 transition-colors'
        ],
        outline: 'bg-transparent border-2 shadow-none hover:shadow-md transition-shadow',
        ghost: 'bg-transparent border-none shadow-none hover:bg-neutral-50 transition-colors'
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10'
      },
      interactive: {
        none: '',
        hover: 'hover:scale-105 transition-transform duration-200 cursor-pointer',
        press: 'active:scale-95 transition-transform duration-100 cursor-pointer',
        float: 'hover:animate-float'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: 'none'
    }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? 'div' : motion.div;
    
    const motionProps = asChild ? {} : {
      whileHover: interactive === 'hover' ? { scale: 1.02 } : {},
      whileTap: interactive === 'press' ? { scale: 0.98 } : {},
      transition: { duration: 0.2 }
    };

    return (
      <Comp
        className={cn(cardVariants({ variant, size, interactive, className }))}
        ref={ref}
        {...motionProps}
        // @ts-ignore - exactOptionalPropertyTypes conflict with framer-motion  
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight text-neutral-900', className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-600', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-neutral-700', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-6', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
