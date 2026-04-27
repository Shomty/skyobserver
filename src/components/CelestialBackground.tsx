import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

interface CelestialBackgroundProps {}

export const CelestialBackground: React.FC<CelestialBackgroundProps> = () => {
  const { theme } = useTheme();
  // Generate random stats for stars
  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 1.5 + 0.5,
      // Larger stars twinkle more
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
      // Some stars are colored
      color: Math.random() > 0.9 ? (Math.random() > 0.5 ? '#d4af37' : '#9333ea') : '#ffffff'
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Deep Space Base Gradients */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        theme === 'dark' ? "opacity-100" : "opacity-0"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a051d] via-[#1a0b2e] to-black" />
      </div>

      {/* Atmospheric Nebula Effects */}
      <motion.div
        animate={{
          x: [0, 50, -50, 0],
          y: [0, -40, 40, 0],
          scale: [1, 1.15, 0.9, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className={cn(
          "absolute top-[-20%] left-[-10%] w-[80%] h-[80%] blur-[120px] rounded-full transition-colors duration-1000 opacity-[0.15]",
          theme === 'dark' ? "bg-mystic-purple" : "bg-orange-500/5"
        )}
      />
      
      <motion.div
        animate={{
          x: [0, -60, 60, 0],
          y: [0, 60, -60, 0],
          scale: [1, 1.1, 0.85, 1],
          rotate: [0, -8, 8, 0]
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear"
        }}
        className={cn(
          "absolute bottom-[-20%] right-[-10%] w-[90%] h-[90%] blur-[150px] rounded-full transition-colors duration-1000 opacity-[0.1]",
          theme === 'dark' ? "bg-jyotish-gold" : "bg-blue-500/5"
        )}
      />

      {/* Twinkling Stars */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              backgroundColor: theme === 'dark' ? star.color : '#cbd5e1',
              boxShadow: star.size > 1 ? `0 0 ${star.size * 2}px ${star.color}` : 'none',
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Subtle Drift Particles - for depth */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`drift-${i}`}
            className={cn(
              "absolute blur-[1px] opacity-20",
              theme === 'dark' ? "bg-white/10" : "bg-black/5"
            )}
            style={{
              width: Math.random() * 100 + 50,
              height: 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              rotate: Math.random() * 360,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0, 0.2, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Texture Overlay */}
      <div className={cn(
        "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none transition-opacity duration-1000",
        theme === 'dark' ? "opacity-20 mix-blend-overlay" : "opacity-5"
      )} />
      
      {/* Vignette */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        theme === 'dark' 
          ? "bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-100" 
          : "bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.05)_100%)] opacity-100"
      )} />
    </div>
  );
};
