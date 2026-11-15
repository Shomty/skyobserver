import { useState } from 'react';
import { LockKeyhole, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { loginWithEmail, registerWithEmail, resetPassword, signInWithGoogle } from '../../firebase';
import { AuthDialog, type AuthMode } from './AuthDialog';

interface Props {
  title?: string;
  description?: string;
}

/**
 * Stands in for an AI interpretation panel when nobody is signed in. The
 * computed reading stays free; the Gemini-written interpretation needs an
 * account, and is saved to it. Signing in re-runs the guidance hooks, which
 * watch the auth state, so the interpretation appears without a reload.
 */
export function AiUnlockGate({
  title = 'Unlock your AI interpretation',
  description = 'Create a free account or sign in to get your personalised written interpretation. It is saved to your dashboard so you can come back to it anytime.',
}: Props) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signup');

  const openAs = (next: AuthMode) => {
    setMode(next);
    setOpen(true);
  };

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border px-4 py-6 sm:px-6',
        theme === 'dark'
          ? 'border-jyotish-gold/25 bg-gradient-to-b from-jyotish-gold/[0.08] to-transparent'
          : 'border-amber-300/60 bg-gradient-to-b from-amber-50/90 to-white',
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-jyotish-gold" aria-hidden />
        <LockKeyhole className="h-4 w-4 text-jyotish-gold/80" aria-hidden />
      </div>
      <h3 className="mt-2 font-serif text-heading gold-gradient-text">{title}</h3>
      <p className={cn('mt-2 max-w-2xl text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
        {description}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => openAs('signup')}
          className="rounded-xl bg-jyotish-gold px-5 py-2.5 font-medium text-slate-950 transition hover:brightness-110"
        >
          Create free account
        </button>
        <button
          type="button"
          onClick={() => openAs('signin')}
          className={cn(
            'rounded-xl border px-5 py-2.5 font-medium transition',
            theme === 'dark' ? 'border-white/15 text-white/80 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-50',
          )}
        >
          Sign in
        </button>
      </div>

      {open ? (
        <AuthDialog
          isOpen={open}
          initialMode={mode}
          onModeChange={setMode}
          onClose={() => setOpen(false)}
          onGoogleAuth={signInWithGoogle}
          onEmailSignIn={loginWithEmail}
          onEmailSignUp={registerWithEmail}
          onResetPassword={resetPassword}
          onSuccess={() => setOpen(false)}
        />
      ) : null}
    </section>
  );
}
