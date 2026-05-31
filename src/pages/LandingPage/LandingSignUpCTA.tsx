import React, { useState } from 'react';
import { motion } from 'motion/react';
import { loginWithEmail, registerWithEmail } from '../../firebase';

interface LandingSignUpCTAProps {
  onSignIn: () => Promise<void>;
}

type Mode = 'signin' | 'signup';

export const LandingSignUpCTA: React.FC<LandingSignUpCTAProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('signin');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (mode === 'signup') {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative z-10 py-24 px-6 bg-gradient-to-b from-transparent to-[#0f051d]/80">
      <div className="max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-serif italic font-bold gold-gradient-text mb-3">
            Your chart is waiting
          </h2>
          <p className="font-mono text-xs text-white/40 uppercase tracking-widest mb-10">
            Free to use. No credit card.
          </p>

          {/* Google Sign-In */}
          <button
            onClick={onSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 rounded-xl px-6 py-3 font-semibold text-sm hover:bg-gray-100 transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-mono">— or —</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-jyotish-gold/50 transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-jyotish-gold/50 transition-colors"
            />

            {error && (
              <p className="text-red-400/80 text-xs text-left px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-jyotish-gold text-black rounded-xl px-6 py-3 font-semibold text-sm hover:bg-celestial-gold transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {isLoading
                ? 'Please wait…'
                : mode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
            </button>
          </form>

          {/* Toggle mode */}
          <button
            onClick={() => { setMode(prev => (prev === 'signin' ? 'signup' : 'signin')); setError(null); }}
            className="mt-4 text-white/40 text-xs hover:text-white/60 transition-colors"
          >
            {mode === 'signin'
              ? "Don't have an account? Create one"
              : 'Already have an account? Sign in'}
          </button>

          {mode === 'signup' && (
            <p className="mt-3 text-white/30 text-[11px] font-mono text-center leading-relaxed">
              New accounts require admin approval before full access is granted.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};
