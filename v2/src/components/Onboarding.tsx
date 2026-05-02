import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Loader2,
  Clock,
  Info,
  Lock,
  Mail,
  LogIn,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { signInWithGoogle, loginWithEmail, registerWithEmail } from '../firebase';
import { withRetry, getErrorMessage } from '../lib/api-utils';
import { APIErrorMessage } from './APIErrorMessage';

interface OnboardingFlowProps {
  theme: 'light' | 'dark';
  onComplete: (data: any) => Promise<void>;
  user: any;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ theme, onComplete, user }) => {
  const [step, setStep] = useState(user ? 2 : 1);
  const [isLoading, setIsLoading] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [isCitySearching, setIsCitySearching] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  // Auth states
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [onboardingError, setOnboardingError] = useState<{ error: any; title: string; retry?: () => void } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'male',
    birthTime: '',
    birthCity: '',
    lat: 0,
    lon: 0
  });

  const steps = [
    { id: 1, title: 'Account', icon: Lock },
    { id: 2, title: 'Personal', icon: User },
    { id: 3, title: 'Birth', icon: Calendar },
    { id: 4, title: 'Confirm', icon: CheckCircle2 }
  ];

  useEffect(() => {
    if (user && step === 1) {
      setStep(2);
    }
  }, [user, step]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      // Step will advance via useEffect
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitySearch = async (query: string) => {
    setFormData(prev => ({ ...prev, birthCity: query }));
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }

    setIsCitySearching(true);
    setOnboardingError(null);
    try {
      // 1. Try proxy first
      let res = await withRetry(() => fetch(`/api/geocode?name=${encodeURIComponent(query)}`));
      
      // 2. Fallback to direct if proxy fails
      if (!res.ok) {
        res = await withRetry(() => fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`));
      }

      if (res.ok) {
        const data = await res.json();
        setCitySuggestions(data.results || []);
        setShowCitySuggestions(true);
      } else {
        throw new Error("Geocoding service returned an error");
      }
    } catch (e) {
      console.error("Geocoding error:", e);
      setOnboardingError({
        error: e,
        title: "City Search Failed",
        retry: () => handleCitySearch(query)
      });
    } finally {
      setIsCitySearching(false);
    }
  };

  const selectCity = (city: any) => {
    setFormData(prev => ({
      ...prev,
      birthCity: `${city.name}, ${city.admin1 || ''} ${city.country}`,
      lat: city.latitude,
      lon: city.longitude
    }));
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await onComplete(formData);
    } catch (error) {
      console.error("Onboarding completion error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) return user !== null;
    if (step === 2) return formData.firstName.trim().length > 0 && formData.lastName.trim().length > 0;
    if (step === 3) return formData.birthTime && formData.birthCity && formData.lat !== 0;
    return true;
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4 transition-colors duration-500",
      theme === 'dark' ? "bg-[#050505] text-white" : "bg-slate-50 text-slate-900"
    )}>
      {/* Progress Header */}
      <div className="fixed top-0 left-0 w-full p-6 flex justify-center z-50">
        <div className="flex items-center gap-4">
          {steps.map((s, i) => {
            const isCompleted = step > s.id || (s.id === 1 && user);
            const isActive = step === s.id;
            
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500",
                    isCompleted || isActive
                      ? "bg-jyotish-gold border-jyotish-gold text-black shadow-lg shadow-jyotish-gold/20" 
                      : theme === 'dark' ? "bg-white/5 border-white/10 text-white/20" : "bg-white border-slate-200 text-slate-300"
                  )}>
                    {isCompleted && !isActive ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                  </div>
                  <span className={cn(
                    "text-[8px] font-mono uppercase tracking-widest transition-colors duration-500",
                    isCompleted || isActive ? "text-jyotish-gold" : theme === 'dark' ? "text-white/20" : "text-slate-300"
                  )}>
                    {s.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn(
                    "w-12 h-[1px] mb-6 transition-colors duration-500",
                    isCompleted ? "bg-jyotish-gold" : theme === 'dark' ? "bg-white/10" : "bg-slate-200"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={cn(
          "w-full max-w-lg p-8 rounded-3xl border relative z-10 backdrop-blur-xl shadow-2xl transition-colors duration-500",
          theme === 'dark' ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
        )}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className={cn("text-2xl font-bold font-serif italic mb-2", theme === 'dark' ? "text-jyotish-gold" : "text-slate-900")}>
                  {user ? 'Account Verified' : (isLogin ? 'Welcome Back' : 'Create Account')}
                </h2>
                <p className={cn("text-xs font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                  {user ? 'You are successfully logged in' : (isLogin ? 'Sign in to your cosmic profile' : 'Begin your journey with us')}
                </p>
              </div>

              {user ? (
                <div className="flex flex-col items-center gap-6 py-8">
                  <div className="w-20 h-20 rounded-full bg-jyotish-gold/20 flex items-center justify-center border border-jyotish-gold/30">
                    <CheckCircle2 className="w-10 h-10 text-jyotish-gold" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold mb-1">{user.email}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Ready to continue</p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-jyotish-gold hover:bg-jyotish-gold/90 text-black font-bold py-4 rounded-xl shadow-lg shadow-jyotish-gold/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span className="uppercase tracking-widest text-[10px]">Continue to Onboarding</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {authError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {authError}
                    </div>
                  )}

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                      <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-jyotish-gold/50" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={cn(
                            "w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all outline-none",
                            theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-jyotish-gold/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-jyotish-gold/50"
                          )}
                          placeholder="seeker@cosmos.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-jyotish-gold/50" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={cn(
                            "w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all outline-none",
                            theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-jyotish-gold/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-jyotish-gold/50"
                          )}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-jyotish-gold hover:bg-jyotish-gold/90 text-black font-bold py-4 rounded-xl shadow-lg shadow-jyotish-gold/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />)}
                      <span className="uppercase tracking-widest text-[10px]">
                        {isLogin ? 'Sign In' : 'Register Account'}
                      </span>
                    </button>
                  </form>

                  <div className="relative my-6">
                    <div className={cn("absolute inset-0 flex items-center", theme === 'dark' ? "opacity-10" : "opacity-20")}>
                      <div className="w-full border-t border-current"></div>
                    </div>
                    <div className="relative flex justify-center text-[8px] uppercase tracking-widest font-mono">
                      <span className={cn("px-4", theme === 'dark' ? "bg-[#0a0a0a] text-white/40" : "bg-white text-slate-400")}>Or</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className={cn(
                      "w-full py-3 rounded-xl border flex items-center justify-center gap-3 transition-all active:scale-[0.98]",
                      theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-900 shadow-sm"
                    )}
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/button/google.svg" alt="Google" className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Continue with Google</span>
                  </button>

                  <div className="text-center mt-4">
                    <button
                      onClick={() => setIsLogin(!isLogin)}
                      className={cn(
                        "text-[10px] uppercase tracking-widest font-mono transition-colors",
                        theme === 'dark' ? "text-white/40 hover:text-jyotish-gold" : "text-slate-400 hover:text-jyotish-gold"
                      )}
                    >
                      {isLogin ? "New here? Register an account" : "Already have an account? Sign In"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className={cn("text-2xl font-bold font-serif italic mb-2", theme === 'dark' ? "text-jyotish-gold" : "text-slate-900")}>
                  Personal Details
                </h2>
                <p className={cn("text-xs font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                  Tell us about yourself
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-slate-400")}>First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-jyotish-gold/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-jyotish-gold/50"
                    )}
                    placeholder="Arjuna"
                  />
                </div>
                <div className="space-y-2">
                  <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-jyotish-gold/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-jyotish-gold/50"
                    )}
                    placeholder="Pandava"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {['male', 'female', 'other'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-mono uppercase tracking-widest transition-all",
                        formData.gender === g 
                          ? "bg-jyotish-gold border-jyotish-gold text-black font-bold shadow-lg shadow-jyotish-gold/20" 
                          : theme === 'dark' ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className={cn("text-2xl font-bold font-serif italic mb-2", theme === 'dark' ? "text-jyotish-gold" : "text-slate-900")}>
                  Birth Details
                </h2>
                <p className={cn("text-xs font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                  The stars alignment at your arrival
                </p>
              </div>

              <div className="space-y-2">
                <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Date & Time of Birth</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-jyotish-gold/50" />
                  <input
                    type="datetime-local"
                    value={formData.birthTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthTime: e.target.value }))}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all outline-none",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-jyotish-gold/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-jyotish-gold/50"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Place of Birth</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-jyotish-gold/50" />
                  <input
                    type="text"
                    value={formData.birthCity}
                    onChange={(e) => handleCitySearch(e.target.value)}
                    onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all outline-none",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-jyotish-gold/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-jyotish-gold/50"
                    )}
                    placeholder="Search city..."
                  />
                  {isCitySearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-jyotish-gold" />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {onboardingError && (
                    <APIErrorMessage 
                      error={onboardingError.error}
                      title={onboardingError.title}
                      onRetry={() => {
                        const retryFn = onboardingError.retry;
                        setOnboardingError(null);
                        retryFn?.();
                      }}
                      onClear={() => setOnboardingError(null)}
                      className="mt-2 text-xs"
                    />
                  )}
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "absolute z-50 left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden",
                        theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-slate-200"
                      )}
                    >
                      {citySuggestions.map((city, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectCity(city)}
                          className={cn(
                            "w-full p-3 text-left text-xs transition-colors border-b last:border-0",
                            theme === 'dark' ? "hover:bg-white/5 border-white/5 text-white/80" : "hover:bg-slate-50 border-slate-100 text-slate-700"
                          )}
                        >
                          <div className="font-bold">{city.name}</div>
                          <div className="text-[10px] opacity-60">{city.admin1 || ''}, {city.country}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className={cn("text-2xl font-bold font-serif italic mb-2", theme === 'dark' ? "text-jyotish-gold" : "text-slate-900")}>
                  Final Confirmation
                </h2>
                <p className={cn("text-xs font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                  Verify your cosmic coordinates
                </p>
              </div>

              <div className={cn(
                "p-6 rounded-2xl border space-y-4",
                theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
              )}>
                <div className="flex justify-between items-center">
                  <span className={cn("text-[10px] font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Name</span>
                  <span className="text-sm font-bold">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={cn("text-[10px] font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Gender</span>
                  <span className="text-sm font-bold capitalize">{formData.gender}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={cn("text-[10px] font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Birth Time</span>
                  <span className="text-sm font-bold">{formData.birthTime ? format(new Date(formData.birthTime), 'MMM d, yyyy HH:mm') : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={cn("text-[10px] font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Birth Place</span>
                  <span className="text-sm font-bold text-right max-w-[200px]">{formData.birthCity}</span>
                </div>
              </div>

              <div className={cn("p-4 rounded-xl flex items-start gap-3", theme === 'dark' ? "bg-jyotish-gold/5 border border-jyotish-gold/10" : "bg-orange-50 border border-orange-100")}>
                <Info className="w-4 h-4 text-jyotish-gold shrink-0 mt-0.5" />
                <p className={cn("text-[10px] leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-600")}>
                  Your birth details are used to calculate your unique natal chart and provide personalized astrological insights. You can always update these later in your profile.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 mt-10">
          {step > 1 && (
            <button
              onClick={() => setStep(prev => prev - 1)}
              disabled={isLoading}
              className={cn(
                "flex-1 py-4 rounded-xl border flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                theme === 'dark' ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">Back</span>
            </button>
          )}
          
          {step > 1 && (
            <button
              onClick={() => step < 4 ? setStep(prev => prev + 1) : handleComplete()}
              disabled={isLoading || !isStepValid()}
              className={cn(
                "flex-[2] py-4 rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                isStepValid() 
                  ? "bg-jyotish-gold text-black shadow-lg shadow-jyotish-gold/20 hover:bg-jyotish-gold/90" 
                  : theme === 'dark' ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-slate-100 text-slate-300 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="text-[10px] font-mono uppercase tracking-widest">
                    {step === 4 ? 'Complete Setup' : 'Continue'}
                  </span>
                  {step < 4 && <ChevronRight className="w-4 h-4" />}
                  {step === 4 && <Sparkles className="w-4 h-4" />}
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
