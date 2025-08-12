import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface BigButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function BigButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className = ''
}: BigButtonProps) {
  const baseClasses = "rounded-3xl font-bold shadow-candy transition-all duration-200 select-none";
  
  const sizeClasses = {
    sm: "px-6 py-3 text-lg",
    md: "px-8 py-4 text-xl",
    lg: "px-12 py-6 text-2xl"
  };
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-brand to-brand-dark text-white hover:from-brand-dark hover:to-brand",
    secondary: "bg-gradient-to-r from-accent to-accent-dark text-white hover:from-accent-dark hover:to-accent",
    success: "bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-600 hover:to-green-400"
  };

  return (
    <motion.button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      animate={disabled ? {} : {
        scale: [1, 1.02, 1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }}
      style={{
        minHeight: size === 'lg' ? '72px' : size === 'md' ? '56px' : '48px'
      }}
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </motion.button>
  );
}
