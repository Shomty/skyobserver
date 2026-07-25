import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Orbit,
  Sparkles,
  X,
} from 'lucide-react';

export type AuthMode = 'signin' | 'signup' | 'reset';

type AuthAction = () => void | Promise<unknown>;
type EmailAuthAction = (email: string, password: string) => void | Promise<unknown>;
type ResetPasswordAction = (email: string) => void | Promise<unknown>;

export interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleAuth: AuthAction;
  onEmailSignIn: EmailAuthAction;
  onEmailSignUp: EmailAuthAction;
  onResetPassword: ResetPasswordAction;
  initialMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  onSuccess?: (mode: AuthMode) => void;
}

const MODE_CONTENT: Record<AuthMode, { eyebrow: string; title: string; description: string }> = {
  signin: {
    eyebrow: 'Return to your profile',
    title: 'Welcome back.',
    description: 'Sign in to continue exploring your patterns, chapters, and reflections.',
  },
  signup: {
    eyebrow: 'Begin your journey',
    title: 'Create your account.',
    description: 'Save your profile map, reflections, and the personal details that matter to you.',
  },
  reset: {
    eyebrow: 'Restore your orbit',
    title: 'Reset your password.',
    description: 'Enter your email and we will send you a secure link to choose a new password.',
  },
};

function getFirebaseErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code ?? '').replace(/^auth\//, '');
  }

  if (error instanceof Error) {
    const match = error.message.match(/auth\/([a-z-]+)/i);
    return match?.[1] ?? '';
  }

  return '';
}

export function getFriendlyAuthError(error: unknown): string {
  const code = getFirebaseErrorCode(error);
  const messages: Record<string, string> = {
    'invalid-email': 'Enter a valid email address.',
    'missing-email': 'Enter your email address to continue.',
    'missing-password': 'Enter your password to continue.',
    'invalid-credential': 'The email or password is incorrect. Please try again.',
    'wrong-password': 'The email or password is incorrect. Please try again.',
    'user-not-found': 'The email or password is incorrect. Please try again.',
    'email-already-in-use': 'An account already exists for this email. Try signing in instead.',
    'weak-password': 'Choose a stronger password with at least 6 characters.',
    'user-disabled': 'This account has been disabled. Contact support for help.',
    'too-many-requests': 'Too many attempts. Wait a moment, then try again.',
    'network-request-failed': 'We could not reach the authentication service. Check your connection.',
    'popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.',
    'popup-closed-by-user': 'The Google sign-in window was closed before completion.',
    'cancelled-popup-request': 'Another sign-in window is already open.',
    'operation-not-allowed': 'This sign-in method is not currently available.',
    'unauthorized-domain': 'Google sign-in is not available from this domain.',
  };

  if (messages[code]) return messages[code];
  if (error instanceof Error && error.message && !error.message.includes('Firebase')) {
    return error.message;
  }
  return 'Something interrupted authentication. Please try again.';
}

const inputClassName =
  'w-full rounded-xl border border-white/10 bg-white/[0.045] px-11 py-3.5 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 hover:border-white/15 focus:border-cosmic-accent/60 focus:bg-white/[0.065] focus:ring-2 focus:ring-cosmic-accent/15 disabled:cursor-not-allowed disabled:opacity-60';

export function AuthDialog({
  isOpen,
  onClose,
  onGoogleAuth,
  onEmailSignIn,
  onEmailSignUp,
  onResetPassword,
  initialMode = 'signin',
  onModeChange,
  onSuccess,
}: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const passwordGuidanceId = useId();

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setPasswordConfirmation('');
    setShowPassword(false);
    setError(null);
    setNotice(null);
    onModeChange?.(nextMode);
    window.setTimeout(() => emailRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setMode(initialMode);
    setError(null);
    setNotice(null);
    setIsLoading(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [initialMode, isOpen]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => !element.hasAttribute('hidden'));

    if (focusable.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const runAction = async (action: () => void | Promise<unknown>, successMode: AuthMode) => {
    setError(null);
    setNotice(null);
    setIsLoading(true);
    try {
      await action();
      onSuccess?.(successMode);
      if (successMode === 'reset') {
        setNotice('Password reset email sent. Check your inbox and spam folder for the link.');
      } else if (successMode === 'signup') {
        setNotice(
          'Your account has been created and submitted for approval. We will let you in as soon as an administrator approves access.',
        );
        setPassword('');
        setPasswordConfirmation('');
      } else {
        onClose();
      }
    } catch (authError) {
      setError(getFriendlyAuthError(authError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (mode === 'reset') {
      void runAction(() => onResetPassword(normalizedEmail), 'reset');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Use at least 6 characters for your password.');
        return;
      }
      if (password !== passwordConfirmation) {
        setError('The passwords do not match. Please enter them again.');
        return;
      }
      void runAction(() => onEmailSignUp(normalizedEmail, password), 'signup');
      return;
    }

    void runAction(() => onEmailSignIn(normalizedEmail, password), 'signin');
  };

  if (!isOpen) return null;

  const content = MODE_CONTENT[mode];
  const isConfirmation = Boolean(notice);
  const submitLabel =
    mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#030406]/90 px-4 py-8 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isLoading}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0c10] text-stone-100 shadow-[0_32px_100px_rgba(0,0,0,0.75)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(157,124,255,0.14),transparent_32%),radial-gradient(circle_at_95%_20%,rgba(91,33,182,0.12),transparent_28%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cosmic-accent/60 to-transparent"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication dialog"
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/20 p-2 text-stone-500 transition hover:border-white/20 hover:text-stone-100 focus:outline-none focus:ring-2 focus:ring-cosmic-accent/50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="relative px-6 pb-7 pt-8 sm:px-9 sm:pb-9">
          <div className="mb-7 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cosmic-accent/25 bg-cosmic-accent/[0.08] text-cosmic-accent">
              <Orbit className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-cosmic-accent/70">
                Soul Blueprint
              </p>
              <p className="mt-1 text-xs text-stone-500">Pattern & reflection studio</p>
            </div>
          </div>

          <header className="mb-7 border-b border-white/[0.07] pb-6">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">
              {content.eyebrow}
            </p>
            <h2 id={titleId} className="font-serif text-3xl font-medium leading-tight text-stone-50">
              {content.title}
            </h2>
            <p id={descriptionId} className="mt-3 max-w-sm text-sm leading-6 text-stone-400">
              {content.description}
            </p>
          </header>

          {isConfirmation ? (
            <div className="space-y-5">
              <div
                role="status"
                className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5"
              >
                <CheckCircle2 className="mb-3 h-6 w-6 text-emerald-300" aria-hidden="true" />
                <p className="text-sm leading-6 text-emerald-50/90">{notice}</p>
              </div>
              {mode === 'signup' && (
                <p className="text-xs leading-5 text-stone-500">
                  Approval protects the community and its members. You can safely close this
                  window while your request is reviewed.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => changeMode('signin')}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-300 transition hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-cosmic-accent/50"
                >
                  Back to sign in
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-cosmic-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-cosmic-glow hover:text-cosmic-deep focus:outline-none focus:ring-2 focus:ring-cosmic-accent focus:ring-offset-2 focus:ring-offset-[#0a0c10]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {mode !== 'reset' && (
                <>
                  <button
                    type="button"
                    onClick={() => void runAction(onGoogleAuth, mode)}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-semibold text-stone-200 transition hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-cosmic-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.35Z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M6.4 13.91A6 6 0 0 1 6.09 12c0-.66.11-1.3.31-1.91V7.5H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.5l3.34-2.59Z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.97c1.47 0 2.79.5 3.83 1.5l2.86-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.5l3.34 2.59c.8-2.36 3-4.12 5.6-4.12Z"
                        />
                      </svg>
                    )}
                    Continue with Google
                  </button>

                  <div className="my-5 flex items-center gap-3" aria-hidden="true">
                    <span className="h-px flex-1 bg-white/[0.07]" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-600">
                      or use email
                    </span>
                    <span className="h-px flex-1 bg-white/[0.07]" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor={`${titleId}-email`}
                    className="mb-2 block text-xs font-medium text-stone-300"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-600"
                      aria-hidden="true"
                    />
                    <input
                      ref={emailRef}
                      id={`${titleId}-email`}
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      disabled={isLoading}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? errorId : undefined}
                      className={inputClassName}
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor={`${titleId}-password`}
                        className="text-xs font-medium text-stone-300"
                      >
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => changeMode('reset')}
                          className="text-xs text-cosmic-accent/80 transition hover:text-cosmic-accent focus:outline-none focus:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <LockKeyhole
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-600"
                        aria-hidden="true"
                      />
                      <input
                        id={`${titleId}-password`}
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        required
                        minLength={mode === 'signup' ? 6 : undefined}
                        disabled={isLoading}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                          mode === 'signup'
                            ? `${passwordGuidanceId}${error ? ` ${errorId}` : ''}`
                            : error
                              ? errorId
                              : undefined
                        }
                        className={`${inputClassName} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        disabled={isLoading}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-stone-500 transition hover:text-stone-200 focus:outline-none focus:ring-2 focus:ring-cosmic-accent/50"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {mode === 'signup' && (
                      <p id={passwordGuidanceId} className="mt-2 text-[11px] leading-4 text-stone-500">
                        Use at least 6 characters. A longer, unique password is safer.
                      </p>
                    )}
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor={`${titleId}-password-confirmation`}
                      className="mb-2 block text-xs font-medium text-stone-300"
                    >
                      Confirm password
                    </label>
                    <div className="relative">
                      <LockKeyhole
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-600"
                        aria-hidden="true"
                      />
                      <input
                        id={`${titleId}-password-confirmation`}
                        name="password-confirmation"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        disabled={isLoading}
                        value={passwordConfirmation}
                        onChange={(event) => setPasswordConfirmation(event.target.value)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? errorId : undefined}
                        className={inputClassName}
                      />
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="flex gap-3 rounded-xl border border-cosmic-accent/15 bg-cosmic-accent/[0.06] p-3.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cosmic-accent/70" aria-hidden="true" />
                    <p className="text-[11px] leading-5 text-stone-400">
                      New accounts require administrator approval before full access is granted.
                    </p>
                  </div>
                )}

                {error && (
                  <div
                    id={errorId}
                    role="alert"
                    className="flex gap-3 rounded-xl border border-red-300/15 bg-red-300/[0.06] p-3.5 text-xs leading-5 text-red-100/90"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cosmic-accent px-5 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-cosmic-glow hover:text-cosmic-deep focus:outline-none focus:ring-2 focus:ring-cosmic-accent focus:ring-offset-2 focus:ring-offset-[#0a0c10] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isLoading ? 'Please wait' : submitLabel}
                </button>
              </form>

              <div className="mt-5 text-center">
                {mode === 'reset' ? (
                  <button
                    type="button"
                    onClick={() => changeMode('signin')}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 text-xs text-stone-400 transition hover:text-stone-100 focus:outline-none focus:underline disabled:opacity-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Back to sign in
                  </button>
                ) : (
                  <p className="text-xs text-stone-500">
                    {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => changeMode(mode === 'signin' ? 'signup' : 'signin')}
                      disabled={isLoading}
                      className="font-medium text-cosmic-accent/80 transition hover:text-cosmic-accent focus:outline-none focus:underline disabled:opacity-50"
                    >
                      {mode === 'signin' ? 'Create an account' : 'Sign in'}
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthDialog;
