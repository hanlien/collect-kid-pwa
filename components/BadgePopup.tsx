'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import Image from 'next/image';

interface BadgePopupProps {
  isOpen: boolean;
  onClose: () => void;
  speciesName: string;
  category: string;
  imageUrl?: string;
}

export default function BadgePopup({ isOpen, onClose, speciesName, category, imageUrl }: BadgePopupProps) {
  const categoryEmoji = {
    flower: '🌸',
    bug: '🦋',
    animal: '🐾',
  }[category];

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4ade80', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'],
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Popup */}
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            {/* Content */}
            <div className="relative">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100" />
              
              {/* Token design */}
              <div className="relative p-8 text-center">
                {/* Outer ring */}
                <motion.div
                  className="absolute inset-0 rounded-3xl border-8 border-yellow-400"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                
                {/* Inner ring */}
                <motion.div
                  className="absolute inset-4 rounded-2xl border-4 border-orange-300"
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                {/* Badge icon */}
                <motion.div
                  className="relative z-10 w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  onAnimationComplete={triggerConfetti}
                >
                  <Award className="w-12 h-12 text-white" />
                </motion.div>

                {/* Species image */}
                {imageUrl && (
                  <motion.div
                    className="relative z-10 w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg border-4 border-white"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: "spring", damping: 15 }}
                  >
                    <Image
                      src={imageUrl}
                      alt={speciesName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </motion.div>
                )}

                {/* Text content */}
                <motion.div
                  className="relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-4xl mb-2">{categoryEmoji}</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    New Species Unlocked!
                  </h3>
                  <p className="text-lg text-gray-600 mb-4">
                    {speciesName}
                  </p>
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full font-semibold">
                    🎉 Congratulations! 🎉
                  </div>
                </motion.div>

                {/* Floating stars */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-400"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${10 + (i % 2) * 80}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, 180, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2,
                    }}
                  >
                    <Star className="w-4 h-4" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
