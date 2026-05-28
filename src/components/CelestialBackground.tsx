import React, { useMemo } from 'react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

interface CelestialBackgroundProps {}

// Static drift particles (3 reduced from 8)
const DRIFT_PARTICLES = [
  { width: 120, height: 1, left: '15%', top: '30%', rotate: 45, duration: '18s', delay: '0s' },
  { width: 80, height: 1, left: '65%', top: '70%', rotate: 135, duration: '22s', delay: '6s' },
  { width: 100, height: 1, left: '45%', top: '55%', rotate: 210, duration: '26s', delay: '12s' },
];

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
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
        @keyframes nebula-drift-1 {
          0%   { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          25%  { transform: translate(50px, -40px) scale(1.15) rotate(5deg); }
          50%  { transform: translate(-50px, 40px) scale(0.9) rotate(-5deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
        }
        @keyframes nebula-drift-2 {
          0%   { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          25%  { transform: translate(-60px, 60px) scale(1.1) rotate(-8deg); }
          50%  { transform: translate(60px, -60px) scale(0.85) rotate(8deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
        }
        @keyframes drift-particle {
          0%   { transform: translate(0px, 0px); opacity: 0; }
          20%  { opacity: 0.2; }
          80%  { opacity: 0.2; }
          100% { transform: translate(60px, 40px); opacity: 0; }
        }
      `}</style>

      {/* Deep Space Base Gradients */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        theme === 'dark' ? "opacity-100" : "opacity-0"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a051d] via-[#1a0b2e] to-black" />
      </div>

      {/* Atmospheric Nebula Effects */}
      <div
        style={{ animation: 'nebula-drift-1 60s linear infinite' }}
        className={cn(
          "absolute top-[-20%] left-[-10%] w-[80%] h-[80%] blur-[120px] rounded-full transition-colors duration-1000 opacity-[0.15]",
          theme === 'dark' ? "bg-mystic-purple" : "bg-orange-500/5"
        )}
      />

      <div
        style={{ animation: 'nebula-drift-2 90s linear infinite' }}
        className={cn(
          "absolute bottom-[-20%] right-[-10%] w-[90%] h-[90%] blur-[150px] rounded-full transition-colors duration-1000 opacity-[0.1]",
          theme === 'dark' ? "bg-jyotish-gold" : "bg-blue-500/5"
        )}
      />

      {/* Twinkling Stars */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              backgroundColor: theme === 'dark' ? star.color : '#cbd5e1',
              boxShadow: star.size > 1 ? `0 0 ${star.size * 2}px ${star.color}` : 'none',
              animation: `star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Subtle Drift Particles - for depth (3 particles) */}
      <div className="absolute inset-0">
        {DRIFT_PARTICLES.map((p, i) => (
          <div
            key={`drift-${i}`}
            className={cn(
              "absolute blur-[1px] opacity-20",
              theme === 'dark' ? "bg-white/10" : "bg-black/5"
            )}
            style={{
              width: p.width,
              height: p.height,
              left: p.left,
              top: p.top,
              transform: `rotate(${p.rotate}deg)`,
              animation: `drift-particle ${p.duration} linear ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

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
