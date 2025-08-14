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
      <svg 
        viewBox="0 0 192 192" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="buggiesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#7dd3fc', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#0ea5e9', stopOpacity: 1}} />
          </linearGradient>
          <linearGradient id="brandonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#fbbf24', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#f59e0b', stopOpacity: 1}} />
          </linearGradient>
          <linearGradient id="bugBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#fb923c', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#ea580c', stopOpacity: 1}} />
          </linearGradient>
          <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: '#e0f2fe', stopOpacity: 0.8}} />
            <stop offset="100%" style={{stopColor: '#0ea5e9', stopOpacity: 0.3}} />
          </linearGradient>
          <linearGradient id="foliageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#86efac', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#16a34a', stopOpacity: 1}} />
          </linearGradient>
          <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: '#fb923c', stopOpacity: 0.6}} />
            <stop offset="25%" style={{stopColor: '#fbbf24', stopOpacity: 0.6}} />
            <stop offset="50%" style={{stopColor: '#86efac', stopOpacity: 0.6}} />
            <stop offset="75%" style={{stopColor: '#7dd3fc', stopOpacity: 0.6}} />
            <stop offset="100%" style={{stopColor: '#a855f7', stopOpacity: 0.6}} />
          </linearGradient>
        </defs>
        
        {/* Background */}
        <rect width="192" height="192" fill="#f0fdf4"/>
        
        {/* Rainbow */}
        <path d="M 20 40 Q 96 20 172 40" stroke="url(#rainbowGradient)" strokeWidth="8" fill="none" opacity="0.7"/>
        
        {/* Hearts */}
        <path d="M 30 30 Q 30 20 40 20 Q 50 20 50 30 Q 50 40 40 50 Q 30 40 30 30 Z" fill="#fecaca" opacity="0.8"/>
        <path d="M 162 30 Q 162 20 172 20 Q 182 20 182 30 Q 182 40 172 50 Q 162 40 162 30 Z" fill="#fecaca" opacity="0.8"/>
        
        {/* Foliage background */}
        <ellipse cx="96" cy="140" rx="80" ry="40" fill="url(#foliageGradient)" opacity="0.8"/>
        
        {/* BUGGIES text */}
        <text x="96" y="70" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="url(#buggiesGradient)" stroke="#0ea5e9" strokeWidth="1">
          BUGGIES
        </text>
        
        {/* WITH text */}
        <text x="96" y="90" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white" stroke="#1e40af" strokeWidth="0.5">
          WITH
        </text>
        
        {/* BRANDON text */}
        <text x="96" y="110" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="url(#brandonGradient)" stroke="#0ea5e9" strokeWidth="1">
          BRANDON
        </text>
        
        {/* Bug character */}
        {/* Wings */}
        <ellipse cx="70" cy="140" rx="15" ry="8" fill="url(#wingGradient)" stroke="#0ea5e9" strokeWidth="1" opacity="0.8"/>
        <ellipse cx="122" cy="140" rx="15" ry="8" fill="url(#wingGradient)" stroke="#0ea5e9" strokeWidth="1" opacity="0.8"/>
        
        {/* Bug body */}
        <ellipse cx="96" cy="145" rx="12" ry="8" fill="url(#bugBodyGradient)" stroke="#1e40af" strokeWidth="1"/>
        
        {/* Bug spots */}
        <circle cx="90" cy="140" r="2" fill="#1e40af"/>
        <circle cx="102" cy="140" r="2" fill="#1e40af"/>
        <circle cx="96" cy="150" r="3" fill="#1e40af"/>
        
        {/* Bug head */}
        <circle cx="96" cy="135" r="6" fill="url(#bugBodyGradient)" stroke="#1e40af" strokeWidth="1"/>
        
        {/* Bug eyes */}
        <circle cx="94" cy="133" r="1.5" fill="black"/>
        <circle cx="98" cy="133" r="1.5" fill="black"/>
        <circle cx="94.5" cy="132.5" r="0.5" fill="white"/>
        <circle cx="98.5" cy="132.5" r="0.5" fill="white"/>
        
        {/* Bug smile */}
        <path d="M 92 137 Q 96 140 100 137" stroke="#1e40af" strokeWidth="1" fill="none"/>
        
        {/* Bug antennae */}
        <path d="M 92 130 Q 90 125 88 120" stroke="#8b4513" strokeWidth="1" fill="none"/>
        <path d="M 100 130 Q 102 125 104 120" stroke="#8b4513" strokeWidth="1" fill="none"/>
        
        {/* Bug legs */}
        <path d="M 85 145 L 80 150" stroke="#ea580c" strokeWidth="1" fill="none"/>
        <path d="M 85 147 L 80 152" stroke="#ea580c" strokeWidth="1" fill="none"/>
        <path d="M 85 149 L 80 154" stroke="#ea580c" strokeWidth="1" fill="none"/>
        <path d="M 107 145 L 112 150" stroke="#ea580c" strokeWidth="1" fill="none"/>
        <path d="M 107 147 L 112 152" stroke="#ea580c" strokeWidth="1" fill="none"/>
        <path d="M 107 149 L 112 154" stroke="#ea580c" strokeWidth="1" fill="none"/>
        
        {/* Ground/base */}
        <rect x="0" y="160" width="192" height="32" fill="#0f766e" opacity="0.3"/>
      </svg>
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
