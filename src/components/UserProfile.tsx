import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  MapPin, 
  Bell, 
  Save, 
  ChevronRight, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Calendar,
  Settings,
  BookOpen,
  Compass,
  Sparkles,
  ArrowLeft,
  X
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { DateTimePicker } from './DateTimePicker';
import { combineDateAndTime } from '../lib/dateInputUtils';
import { withRetry, getErrorMessage } from '../lib/api-utils';
import { APIErrorMessage } from './APIErrorMessage';

interface UserProfileProps {
  user: User;
  profile: any;
  onSave: (data: any) => Promise<void>;
  onGeocode: (query: string) => Promise<{ lat: number; lon: number } | null>;
  onClose?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  profile,
  onSave,
  onGeocode,
  onClose
}) => {
  const { theme } = useTheme();
  const [displayName, setDisplayName] = useState(profile?.displayName || user.displayName || "");
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [defaultCity, setDefaultCity] = useState(profile?.defaultLocation?.city || "");
  const [gender, setGender] = useState(profile?.gender || "");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState(profile?.birthDetails?.city || "");
  const [birthLat, setBirthLat] = useState<number | string>(profile?.birthDetails?.lat || "");
  const [birthLon, setBirthLon] = useState<number | string>(profile?.birthDetails?.lon || "");
  
  const [notifications, setNotifications] = useState({
    majorTransits: profile?.notifications?.majorTransits ?? true,
    significantYogas: profile?.notifications?.significantYogas ?? true,
    planetaryConjunctions: profile?.notifications?.planetaryConjunctions ?? true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<any | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [isCitySearching, setIsCitySearching] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [isManualEdit, setIsManualEdit] = useState(false);

  useEffect(() => {
    if (isManualEdit) return; // Don't search if we just selected a city or just initializing
    
    const fetchSuggestions = async () => {
      if (birthPlace.length < 3) {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
        return;
      }

      setIsCitySearching(true);
      try {
        // 1. Try our own proxy first
        let res = await withRetry(() => fetch(`/api/geocode?name=${encodeURIComponent(birthPlace)}`));
        
        // 2. Fallback to Open-Meteo
        if (!res.ok) {
          res = await withRetry(() => fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(birthPlace)}&count=5&language=en&format=json`));
        }
        
        // 3. Fallback to Photon
        if (!res.ok) {
          res = await withRetry(() => fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(birthPlace)}&limit=5`));
          if (res.ok) {
            const data = await res.json();
            const results = data.features.map((f: any) => ({
              name: f.properties.name,
              admin1: f.properties.state || f.properties.country,
              country: f.properties.country,
              latitude: f.geometry.coordinates[1],
              longitude: f.geometry.coordinates[0]
            }));
            setCitySuggestions(results);
            setShowCitySuggestions(true);
            return;
          }
        }

        if (res.ok) {
          const data = await res.json();
          setCitySuggestions(data.results || []);
          setShowCitySuggestions(true);
        }
      } catch (error) {
        console.error("Suggestion fetch failed", error);
      } finally {
        setIsCitySearching(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 600);
    return () => clearTimeout(debounce);
  }, [birthPlace, isManualEdit]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user.displayName || "");
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setDefaultCity(profile.defaultLocation?.city || "");
      setGender(profile.gender || "");
      
      if (profile.birthDetails?.time) {
        const d = new Date(profile.birthDetails.time);
        if (!isNaN(d.getTime())) {
          setBirthDate(d.toISOString().split('T')[0]);
          setBirthTime(d.toTimeString().split(' ')[0].substring(0, 5));
        }
      }
      setBirthPlace(profile.birthDetails?.city || "");
      setBirthLat(profile.birthDetails?.lat ?? "");
      setBirthLon(profile.birthDetails?.lon ?? "");

      setNotifications({
        majorTransits: profile.notifications?.majorTransits ?? true,
        significantYogas: profile.notifications?.significantYogas ?? true,
        planetaryConjunctions: profile.notifications?.planetaryConjunctions ?? true,
      });
    }
  }, [profile, user]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!displayName.trim()) errors.displayName = "Display name is required";
    if (displayName.length < 2) errors.displayName = "Display name must be at least 2 characters";
    if (defaultCity && defaultCity.length < 2) errors.defaultCity = "City name must be at least 2 characters";
    if (!birthDate) errors.birthDate = "Birth date is required";
    if (!birthTime) errors.birthTime = "Birth time is required";
    if (!birthPlace.trim()) errors.birthPlace = "Birth place is required";
    if (!gender) errors.gender = "Gender is required";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCityInput = (val: string) => {
    setBirthPlace(val);
    setIsManualEdit(false);
  };

  const selectCity = (city: any) => {
    setIsManualEdit(true);
    setBirthPlace(`${city.name}${city.admin1 ? `, ${city.admin1}` : ''}, ${city.country}`);
    setBirthLat(city.latitude);
    setBirthLon(city.longitude);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    setSuccessMessage("Location selected");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleLookupBirthPlace = async () => {
    if (!birthPlace.trim()) return;
    setIsGeocoding(true);
    setFormError(null);
    try {
      const coords = await onGeocode(birthPlace.trim());
      if (coords) {
        setBirthLat(coords.lat);
        setBirthLon(coords.lon);
        setSuccessMessage("Coordinates resolved from city name");
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        setFormError({ message: "Could not find coordinates for this city. Please enter manually." });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setFormError(error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAutoDetect = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setBirthLat(position.coords.latitude);
          setBirthLon(position.coords.longitude);
          setSuccessMessage("Current location detected");
          setTimeout(() => setSuccessMessage(null), 2000);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setFormError({ message: "Position access denied or unavailable." });
        }
      );
    } else {
      setFormError({ message: "Geolocation not supported by your browser." });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setFormError(null);
    setSuccessMessage(null);
    
    try {
      await onSave({
        displayName: displayName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        defaultLocation: {
          city: defaultCity.trim()
        },
        birthDetails: {
          time: new Date(`${birthDate}T${birthTime}`).toISOString(),
          city: birthPlace.trim(),
          lat: typeof birthLat === 'string' ? parseFloat(birthLat) || 0 : birthLat,
          lon: typeof birthLon === 'string' ? parseFloat(birthLon) || 0 : birthLon
        },
        gender,
        notifications
      });
      setSuccessMessage("Profile updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Save error:", error);
      setFormError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn(
      "w-full h-full flex flex-col min-h-0 overflow-y-auto custom-scrollbar transition-colors duration-500 pb-20 lg:pb-10",
      theme === 'dark' ? "bg-mystic-purple/20" : "bg-slate-50"
    )}>
      <div className="max-w-4xl mx-auto w-full px-4 pt-6 lg:pt-10">
        {/* Top Navigation for Mobile */}
        {onClose && (
          <button 
            onClick={onClose}
            className={cn(
              "md:hidden flex items-center gap-2 mb-6 text-xs font-mono uppercase tracking-widest",
              theme === 'dark' ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to SkyCircle
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-jyotish-gold">
              <UserIcon className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-mono">Soul Profile</span>
            </div>
            <h2 className={cn(
              "text-4xl lg:text-5xl font-bold tracking-tighter uppercase italic font-serif leading-none transition-colors duration-500",
              theme === 'dark' ? "text-white" : "text-ink-primary"
            )}>
              Personal <span className="gold-gradient-text italic">Identity</span>
            </h2>
            <p className={cn(
              "text-sm font-mono transition-colors duration-500",
              theme === 'dark' ? "text-white/40" : "text-ink-muted"
            )}>
              Refine your digital presence within the Vedic Sky ecosystem.
            </p>
          </div>
          
          {onClose && (
            <button 
              onClick={onClose}
              className={cn(
                "hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all text-sm font-mono group",
                theme === 'dark' ? "border-white/10 hover:bg-white/5 text-white/60 hover:text-white" : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 shadow-sm"
              )}
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to SkyCircle
            </button>
          )}
        </div>

        {formError && (
          <div className="mb-6">
            <APIErrorMessage 
              error={formError} 
              title="Profile Sync Error" 
              onRetry={handleSave as any} 
              onClear={() => setFormError(null)} 
            />
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Account & Profile */}
          <div className="lg:col-span-12 space-y-8">
            <div className={cn(
              "rounded-3xl border p-6 lg:p-10 transition-colors duration-500 backdrop-blur-sm relative overflow-hidden",
              theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-200 shadow-sm"
            )}>
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-jyotish-gold/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Photo & Basic Info */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-jyotish-gold to-orange-500 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={displayName} 
                        className="w-32 h-32 rounded-full border-2 border-jyotish-gold/50 object-cover relative"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-jyotish-gold/10 border-2 border-jyotish-gold/30 flex items-center justify-center text-jyotish-gold text-4xl font-serif italic relative">
                        {displayName?.[0] || user.email?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className={cn("text-xl font-serif italic font-bold", theme === 'dark' ? "text-white" : "text-ink-primary")}>
                      {displayName || "Seeker"}
                    </h3>
                    <p className={cn("text-xs font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                      Verified Observer
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="md:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                        First Name
                      </label>
                      <div className="relative group">
                        <UserIcon className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-jyotish-gold/50 group-focus-within:text-jyotish-gold")} />
                        <input 
                          type="text" 
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                          className={cn(
                            "w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-300 font-mono text-sm focus:ring-2 focus:ring-jyotish-gold/20 outline-none",
                            theme === 'dark' 
                              ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" 
                              : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                        Last Name
                      </label>
                      <div className="relative group">
                        <UserIcon className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-jyotish-gold/50 group-focus-within:text-jyotish-gold")} />
                        <input 
                          type="text" 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          className={cn(
                            "w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-300 font-mono text-sm focus:ring-2 focus:ring-jyotish-gold/20 outline-none",
                            theme === 'dark' 
                              ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" 
                              : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                        Display Name
                      </label>
                      <div className="relative group">
                        <UserIcon className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", validationErrors.displayName ? "text-red-500" : "text-jyotish-gold/50 group-focus-within:text-jyotish-gold")} />
                        <input 
                          type="text" 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your Name"
                          className={cn(
                            "w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-300 font-mono text-sm focus:ring-2 focus:ring-jyotish-gold/20 outline-none",
                            theme === 'dark' 
                              ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" 
                              : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400",
                            validationErrors.displayName && "border-red-500/50 bg-red-500/5 focus:ring-red-500/20"
                          )}
                        />
                      </div>
                      {validationErrors.displayName && (
                        <p className="text-[10px] text-red-500 font-mono ml-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {validationErrors.displayName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                        Primary Email
                      </label>
                      <div className="relative opacity-60 cursor-not-allowed">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-jyotish-gold/30" />
                        <input 
                          type="email" 
                          value={user.email || ""} 
                          disabled
                          className={cn(
                            "w-full pl-12 pr-4 py-3 rounded-xl border font-mono text-sm",
                            theme === 'dark' ? "bg-white/5 border-white/10 text-white/40" : "bg-slate-50 border-slate-200 text-slate-400"
                          )}
                        />
                      </div>
                      <p className={cn("text-[9px] font-mono ml-1 italic", theme === 'dark' ? "text-white/20" : "text-slate-300")}>Managed via Google Auth</p>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                        Gender
                      </label>
                      <div className="relative group">
                        <UserIcon className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", validationErrors.gender ? "text-red-500" : "text-jyotish-gold/50 group-focus-within:text-jyotish-gold")} />
                        <select 
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className={cn(
                            "w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-300 font-mono text-sm focus:ring-2 focus:ring-jyotish-gold/20 outline-none appearance-none",
                            theme === 'dark' 
                              ? "bg-white/5 border-white/10 text-white" 
                              : "bg-slate-50 border-slate-200 text-slate-900",
                            validationErrors.gender && "border-red-500/50 bg-red-500/5 focus:ring-red-500/20"
                          )}
                        >
                          <option value="" disabled className={theme === 'dark' ? "bg-mystic-purple" : "bg-white"}>Select Gender</option>
                          <option value="male" className={theme === 'dark' ? "bg-mystic-purple" : "bg-white"}>Male</option>
                          <option value="female" className={theme === 'dark' ? "bg-mystic-purple" : "bg-white"}>Female</option>
                          <option value="other" className={theme === 'dark' ? "bg-mystic-purple" : "bg-white"}>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <DateTimePicker
                        label="Date & time of birth"
                        placeholder="Select birth moment"
                        value={combineDateAndTime(birthDate, birthTime)}
                        onChange={(date) => {
                          if (!date) {
                            setBirthDate('');
                            setBirthTime('');
                            return;
                          }
                          setBirthDate(format(date, 'yyyy-MM-dd'));
                          setBirthTime(format(date, 'HH:mm'));
                        }}
                        theme={theme}
                        maxDate={new Date()}
                        showNowButton={false}
                        error={Boolean(validationErrors.birthDate || validationErrors.birthTime)}
                      />
                      {(validationErrors.birthDate || validationErrors.birthTime) && (
                        <p className="text-[10px] text-red-400 font-mono ml-1">
                          {validationErrors.birthDate || validationErrors.birthTime}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between ml-1">
                        <label className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                          Birth Place
                        </label>
                        <div className="flex items-center gap-3">
                          {!showManualCoords && (
                            <button 
                              type="button"
                              onClick={() => setShowManualCoords(true)}
                              className={cn(
                                "text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 transition-colors",
                                theme === 'dark' ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-600"
                              )}
                            >
                              Manual Lat/Lon
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={handleLookupBirthPlace}
                            disabled={isGeocoding || !birthPlace.trim()}
                            className={cn(
                              "text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 transition-colors",
                              theme === 'dark' ? "text-jyotish-gold hover:text-white" : "text-slate-900 hover:text-jyotish-gold",
                              (isGeocoding || !birthPlace.trim()) && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Compass className="w-3 h-3" />}
                            Lookup City
                          </button>
                        </div>
                      </div>
                      <div className="relative group">
                        <MapPin className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", validationErrors.birthPlace ? "text-red-500" : "text-jyotish-gold/50 group-focus-within:text-jyotish-gold")} />
                        <input 
                          type="text" 
                          value={birthPlace}
                          onChange={(e) => handleCityInput(e.target.value)}
                          onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                          onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                          placeholder="Search city..."
                          className={cn(
                            "w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-300 font-mono text-sm focus:ring-2 focus:ring-jyotish-gold/20 outline-none",
                            theme === 'dark' 
                              ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" 
                              : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400",
                            validationErrors.birthPlace && "border-red-500/50 bg-red-500/5 focus:ring-red-500/20"
                          )}
                        />
                        {isCitySearching && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-jyotish-gold" />
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {showCitySuggestions && citySuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={cn(
                              "absolute z-50 left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar",
                              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-surface-card border-border-gold"
                            )}
                          >
                            {citySuggestions.map((city, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => selectCity(city)}
                                className={cn(
                                  "w-full p-3 text-left text-xs transition-colors border-b last:border-0 block hover:bg-jyotish-gold/5",
                                  theme === 'dark' ? "border-white/5 text-white/80" : "border-slate-100 text-slate-700"
                                )}
                              >
                                <div className="font-bold">{city.name}</div>
                                <div className="text-[10px] opacity-60">
                                  {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {showManualCoords && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <div className={cn(
                            "p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-surface-muted border-border-gold"
                          )}>
                            <div className="flex items-center justify-between mb-4">
                              <span className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                                Manual Coordinates
                              </span>
                              <button 
                                type="button"
                                onClick={() => setShowManualCoords(false)}
                                className={cn(
                                  "text-[9px] font-mono uppercase tracking-wider text-red-500 hover:text-red-400"
                                )}
                              >
                                Hide
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/20" : "text-slate-300")}>
                                  Latitude
                                </label>
                                <input 
                                  type="number" 
                                  step="any"
                                  value={birthLat}
                                  onChange={(e) => setBirthLat(e.target.value)}
                                  placeholder="Latitude"
                                  className={cn(
                                    "w-full px-4 py-3 rounded-xl border transition-all duration-300 font-mono text-sm focus:ring-2 focus:ring-jyotish-gold/20 outline-none",
                                    theme === 'dark' 
                                      ? "bg-white/5 border-white/10 text-white" 
                                      : "bg-slate-50 border-slate-200 text-slate-900"
                                  )}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/20" : "text-slate-300")}>
                                  Longitude
                                </label>
                                <input 
                                  type="number" 
                                  step="any"
                                  value={birthLon}
                                  onChange={(e) => setBirthLon(e.target.value)}
                                  placeholder="Longitude"
                                  className={cn(
                                    "w-full px-4 py-3 rounded-xl border transition-all duration-300 font-mono text-sm focus:ring-2 focus:ring-jyotish-gold/20 outline-none",
                                    theme === 'dark' 
                                      ? "bg-white/5 border-white/10 text-white" 
                                      : "bg-slate-50 border-slate-200 text-slate-900"
                                  )}
                                />
                              </div>
                            </div>

                            <div className="mt-4 flex justify-center">
                              <button 
                                type="button"
                                onClick={handleAutoDetect}
                                className={cn(
                                  "text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 transition-colors px-3 py-1 rounded-full border",
                                  theme === 'dark' ? "border-white/10 text-white/40 hover:bg-white/5" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                )}
                              >
                                <MapPin className="w-3 h-3" />
                                Detect My Current Location
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <label className={cn("text-[10px] uppercase tracking-widest font-mono ml-1", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                        Default Tracking City
                      </label>
                      <div className="relative group">
                        <MapPin className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", validationErrors.defaultCity ? "text-red-500" : "text-jyotish-gold/50 group-focus-within:text-jyotish-gold")} />
                        <input 
                          type="text" 
                          value={defaultCity}
                          onChange={(e) => setDefaultCity(e.target.value)}
                          placeholder="e.g. London"
                          className={cn(
                            "w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-300 font-mono text-sm focus:ring-2 focus:ring-jyotish-gold/20 outline-none",
                            theme === 'dark' 
                              ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" 
                              : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400",
                            validationErrors.defaultCity && "border-red-500/50 bg-red-500/5 focus:ring-red-500/20"
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 flex flex-col justify-end">
                      <button 
                        type="submit"
                        disabled={isSaving}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2",
                          isSaving 
                            ? "bg-jyotish-gold/50 text-black cursor-not-allowed"
                            : theme === 'dark'
                            ? "bg-jyotish-gold text-black hover:bg-celestial-gold hover:shadow-orange-500/20" 
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        )}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Profile
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {successMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-500 text-xs font-mono"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {successMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Notifications & Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={cn(
                "rounded-3xl border p-8 transition-colors duration-500 flex flex-col gap-6",
                theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-200 shadow-sm"
              )}>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-jyotish-gold" />
                  <h3 className={cn("text-lg font-serif italic font-bold", theme === 'dark' ? "text-white" : "text-ink-primary")}>Notifications</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { id: 'majorTransits', label: 'Major Planetary Transits', icon: Compass },
                    { id: 'significantYogas', label: 'Significant Yoga Highlights', icon: Sparkles },
                    { id: 'planetaryConjunctions', label: 'Daily Conjunction Alerts', icon: Settings }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          theme === 'dark' ? "bg-white/5 text-white/40 group-hover:text-jyotish-gold" : "bg-slate-50 text-slate-400 group-hover:text-slate-600"
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className={cn("text-sm font-medium", theme === 'dark' ? "text-white/80" : "text-ink-secondary")}>{item.label}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative overflow-hidden",
                          notifications[item.id as keyof typeof notifications] 
                            ? "bg-jyotish-gold" 
                            : theme === 'dark' ? "bg-white/10" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-300",
                          notifications[item.id as keyof typeof notifications] 
                            ? "translate-x-6 bg-black" 
                            : theme === 'dark' ? "bg-white/40" : "bg-white shadow-sm"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn(
                "rounded-3xl border p-8 transition-colors duration-500 flex flex-row items-center gap-6",
                theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-200 shadow-sm"
              )}>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-jyotish-gold" />
                    <h3 className={cn("text-lg font-serif italic font-bold", theme === 'dark' ? "text-white" : "text-ink-primary")}>AI Interpretations</h3>
                  </div>
                  <p className={cn("text-xs font-mono", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>
                    Your saved readings from the celestial mirror.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => {/* Navigate back to stats/archives or handle here */}}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border group",
                    theme === 'dark' ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100 shadow-sm"
                  )}
                >
                  <ChevronRight className="w-5 h-5 text-jyotish-gold transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Account Deletion Area - Subtle but necessary */}
      <div className="max-w-4xl mx-auto w-full px-4 py-20 mt-10">
        <div className={cn(
          "p-8 rounded-3xl border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-all duration-500",
          theme === 'dark' ? "border-red-500/10 bg-red-500/[0.02]" : "border-slate-200 bg-slate-50"
        )}>
          <div className="space-y-1">
            <h4 className={cn("text-sm font-bold font-serif italic", theme === 'dark' ? "text-red-500" : "text-ink-secondary")}>Erase All Memory</h4>
            <p className={cn("text-xs font-mono", theme === 'dark' ? "text-white/20" : "text-ink-faint")}>This will permanently delete your saved charts and historical interpretations.</p>
          </div>
          <button className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
            theme === 'dark' ? "border-red-500/20 text-red-500 hover:bg-red-500/10" : "border-slate-300 text-slate-400 hover:text-red-500 hover:border-red-500"
          )}>
            Request Deletion
          </button>
        </div>
      </div>
    </div>
  );
};
