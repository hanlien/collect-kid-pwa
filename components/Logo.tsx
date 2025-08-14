import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export default function Logo({ size = 'md', className = '', animated = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32', 
    lg: 'w-40 h-40',
    xl: 'w-48 h-48'
  };

  const logoContent = (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img 
        src="/icons/icon-192x192.png" 
        alt="Buggies with Brandon Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );

  if (!animated) {
    return logoContent;
  }

  return (
    <motion.div
      animate={{ 
        y: [0, -8, 0],
        scale: [1, 1.02, 1]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
    >
      {logoContent}
    </motion.div>
  );
}
