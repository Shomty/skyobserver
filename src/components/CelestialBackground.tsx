import React, { useMemo } from 'react';

interface CelestialBackgroundProps {}

// Static drift particles (3 reduced from 8)
const DRIFT_PARTICLES = [
  { width: 120, height: 1, left: '15%', top: '30%', rotate: 45, duration: '18s', delay: '0s' },
  { width: 80, height: 1, left: '65%', top: '70%', rotate: 135, duration: '22s', delay: '6s' },
  { width: 100, height: 1, left: '45%', top: '55%', rotate: 210, duration: '26s', delay: '12s' },
];

export const CelestialBackground: React.FC<CelestialBackgroundProps> = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 72 }).map((_, i) => ({
      id: i,
      left: `${(i * 37.17) % 100}%`,
      top: `${(i * 61.83) % 100}%`,
      size: (i % 5) * 0.24 + 0.5,
      duration: (i % 4) + 3,
      delay: (i % 7) * 0.55,
      color: i % 13 === 0 ? '#9d7cff' : '#ede8f5'
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
      <div className="absolute inset-0 opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-[#08050d] via-[#140a20] to-[#050407]" />
      </div>

      {/* Atmospheric Nebula Effects */}
      <div
        style={{ animation: 'nebula-drift-1 60s linear infinite' }}
        className="absolute left-[-10%] top-[-20%] h-[80%] w-[80%] rounded-full bg-mystic-purple opacity-[0.15] blur-[120px]"
      />

      <div
        style={{ animation: 'nebula-drift-2 90s linear infinite' }}
        className="absolute bottom-[-20%] right-[-10%] h-[90%] w-[90%] rounded-full bg-violet-700 opacity-[0.12] blur-[150px]"
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
              backgroundColor: star.color,
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
            className="absolute bg-white/10 opacity-20 blur-[1px]"
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.48)_100%)]" />
    </div>
  );
};
