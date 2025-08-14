'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900',
      h2: 'text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900',
      h3: 'text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900',
      h4: 'text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900',
      h5: 'text-lg md:text-xl lg:text-2xl font-semibold tracking-tight text-neutral-900',
      h6: 'text-base md:text-lg lg:text-xl font-semibold tracking-tight text-neutral-900',
      'display-large': 'text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-neutral-900',
      'display-medium': 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900',
      'display-small': 'text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900',
      body: 'text-base leading-relaxed text-neutral-700',
      'body-large': 'text-lg leading-relaxed text-neutral-700',
      'body-small': 'text-sm leading-normal text-neutral-600',
      caption: 'text-xs leading-normal text-neutral-500',
      label: 'text-sm font-medium leading-normal text-neutral-700',
      'label-large': 'text-base font-medium leading-normal text-neutral-700',
      'label-small': 'text-xs font-medium leading-normal text-neutral-600',
      overline: 'text-xs font-semibold uppercase tracking-wide text-neutral-500',
      link: 'text-base text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors',
      quote: 'text-lg italic leading-relaxed text-neutral-600 border-l-4 border-primary-200 pl-4',
      code: 'text-sm font-mono bg-neutral-100 px-2 py-1 rounded text-neutral-800'
    },
    color: {
      default: '',
      primary: 'text-primary-600',
      secondary: 'text-secondary-600',
      accent: 'text-accent-600',
      success: 'text-success-600',
      warning: 'text-warning-600',
      error: 'text-error-600',
      muted: 'text-neutral-500',
      white: 'text-white'
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    },
    weight: {
      thin: 'font-thin',
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
      black: 'font-black'
    }
  },
  defaultVariants: {
    variant: 'body',
    color: 'default',
    align: 'left'
  }
});

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, color, align, weight, as, children, ...props }, ref) => {
    // Determine the HTML element based on variant or as prop
    const getElement = () => {
      if (as) return as;
      
      switch (variant) {
        case 'h1':
        case 'display-large':
          return 'h1';
        case 'h2':
        case 'display-medium':
          return 'h2';
        case 'h3':
        case 'display-small':
          return 'h3';
        case 'h4':
          return 'h4';
        case 'h5':
          return 'h5';
        case 'h6':
          return 'h6';
        case 'quote':
          return 'blockquote';
        case 'code':
          return 'code';
        case 'caption':
        case 'overline':
        case 'label':
        case 'label-large':
        case 'label-small':
          return 'span';
        default:
          return 'p';
      }
    };

    const Element = getElement();

    return React.createElement(
      Element,
      {
        className: cn(typographyVariants({ variant, color, align, weight, className })),
        ref,
        ...props
      },
      children
    );
  }
);

Typography.displayName = 'Typography';

// Convenience components for common use cases
export const Heading = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }>(
  ({ level = 1, ...props }, ref) => (
    <Typography variant={`h${level}` as const} ref={ref} {...props} />
  )
);
Heading.displayName = 'Heading';

export const Text = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'> & { size?: 'small' | 'base' | 'large' }>(
  ({ size = 'base', ...props }, ref) => (
    <Typography 
      variant={size === 'small' ? 'body-small' : size === 'large' ? 'body-large' : 'body'} 
      ref={ref} 
      {...props} 
    />
  )
);
Text.displayName = 'Text';

export const Label = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'> & { size?: 'small' | 'base' | 'large' }>(
  ({ size = 'base', ...props }, ref) => (
    <Typography 
      variant={size === 'small' ? 'label-small' : size === 'large' ? 'label-large' : 'label'} 
      ref={ref} 
      {...props} 
    />
  )
);
Label.displayName = 'Label';

export const Display = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'> & { size?: 'small' | 'medium' | 'large' }>(
  ({ size = 'medium', ...props }, ref) => (
    <Typography 
      variant={`display-${size}` as const} 
      ref={ref} 
      {...props} 
    />
  )
);
Display.displayName = 'Display';

export { Typography, typographyVariants };
