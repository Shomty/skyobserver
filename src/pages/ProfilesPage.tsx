import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Loader2,
  ArrowLeft,
  Users,
  Sparkles,
  Check,
  X,
  Star,
  Calendar,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { format } from 'date-fns';

export interface ChildProfile {
  id: string;
  name: string;
  birthTime: string; // ISO
  lat: number;
  lon: number;
  city: string;
  createdAt: string; // ISO
}

interface ProfilesPageProps {
  user: User;
  userProfile: any;
  childProfiles: ChildProfile[];
  activeChildProfileId: string | null;
  onSaveProfile: (profile: Omit<ChildProfile, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
  onLoadProfile: (id: string) => void;
  onClearProfile: () => void;
  onClose: () => void;
  geocode: (query: string) => Promise<{ lat: number; lon: number } | null>;
}

const MAX_PROFILES = 5;

const emptyForm = { name: '', birthTime: '', city: '' };

export const ProfilesPage: React.FC<ProfilesPageProps> = ({
  user,
  userProfile,
  childProfiles,
  activeChildProfileId,
  onSaveProfile,
  onDeleteProfile,
  onLoadProfile,
  onClearProfile,
  onClose,
  geocode,
}) => {
  const { theme } = useTheme();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // City autocomplete
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [isCitySearching, setIsCitySearching] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // City suggestion fetch
  useEffect(() => {
    if (formData.city.length < 3) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(async () => {
      setIsCitySearching(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(formData.city)}&count=5&language=en&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          setCitySuggestions(data.results || []);
          setShowCitySuggestions((data.results || []).length > 0);
        }
      } catch {
        setCitySuggestions([]);
      } finally {
        setIsCitySearching(false);
      }
    }, 500);
    return () => {
      if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    };
  }, [formData.city]);

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (profile: ChildProfile) => {
    setEditingId(profile.id);
    setFormData({
      name: profile.name,
      birthTime: profile.birthTime.slice(0, 16), // datetime-local format
      city: profile.city,
    });
    setFormError(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { setFormError('Name is required.'); return; }
    if (!formData.birthTime) { setFormError('Birth date & time is required.'); return; }
    if (!formData.city.trim()) { setFormError('Birth city is required.'); return; }
    if (!editingId && childProfiles.length >= MAX_PROFILES) {
      setFormError(`Maximum ${MAX_PROFILES} profiles allowed.`);
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const coords = await geocode(formData.city);
      if (!coords) { setFormError('Could not geocode city. Please try a different city name.'); setIsSaving(false); return; }

      await onSaveProfile({
        ...(editingId ? { id: editingId } : {}),
        name: formData.name.trim(),
        birthTime: new Date(formData.birthTime).toISOString(),
        lat: coords.lat,
        lon: coords.lon,
        city: formData.city,
      });

      cancelForm();
    } catch (e) {
      setFormError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await onDeleteProfile(id);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const ownBirthDetails = userProfile?.birthDetails;
  const isOwnChartActive = !activeChildProfileId;

  const cardBase = cn(
    'rounded-3xl border p-5 transition-all',
    theme === 'dark' ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-sm'
  );

  return (
    <div className={cn(
      'min-h-screen flex flex-col transition-colors duration-500',
      theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'
    )}>
      {/* Page Header */}
      <div className={cn(
        'sticky top-0 z-30 px-4 py-4 lg:px-8 border-b flex items-center gap-4 backdrop-blur-xl',
        theme === 'dark' ? 'bg-mystic-purple/60 border-jyotish-gold/10' : 'bg-white/80 border-slate-200'
      )}>
        <button
          onClick={onClose}
          className={cn(
            'p-2 rounded-xl border transition-colors',
            theme === 'dark' ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-jyotish-gold/10 border border-jyotish-gold/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-jyotish-gold" />
          </div>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-tighter italic font-serif gold-gradient-text">People Profiles</h1>
            <p className={cn('text-[10px] uppercase tracking-[0.2em] font-mono', theme === 'dark' ? 'text-jyotish-gold/40' : 'text-slate-400')}>
              Family &amp; Friends · Up to {MAX_PROFILES} profiles
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 lg:px-8 py-6 space-y-8 max-w-3xl mx-auto w-full pb-24">

        {/* Own Chart Card */}
        <section>
          <div className={cn('text-[10px] uppercase tracking-widest font-mono mb-3 flex items-center gap-2', theme === 'dark' ? 'text-jyotish-gold/60' : 'text-slate-400')}>
            <Star className="w-3 h-3" /> Your Own Chart
          </div>
          <div className={cn(
            cardBase,
            isOwnChartActive ? 'ring-2 ring-jyotish-gold/40 border-jyotish-gold/30' : ''
          )}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-jyotish-gold/10 border border-jyotish-gold/20 flex items-center justify-center shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full rounded-2xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-6 h-6 text-jyotish-gold" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('font-bold truncate', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
                  {userProfile?.displayName || user.displayName || user.email}
                </div>
                {ownBirthDetails ? (
                  <div className={cn('text-xs font-mono mt-0.5', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
                    {format(new Date(ownBirthDetails.time), 'MMM d, yyyy • HH:mm')} · {ownBirthDetails.city}
                  </div>
                ) : (
                  <div className={cn('text-xs italic mt-0.5', theme === 'dark' ? 'text-white/30' : 'text-slate-400')}>No birth details saved</div>
                )}
              </div>
              {isOwnChartActive ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-jyotish-gold/10 border border-jyotish-gold/30 text-jyotish-gold text-[10px] uppercase tracking-widest font-bold shrink-0">
                  <Check className="w-3 h-3" /> Active
                </div>
              ) : (
                <button
                  onClick={onClearProfile}
                  className="px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-widest font-bold shrink-0 transition-colors bg-jyotish-gold text-black hover:bg-celestial-gold"
                >
                  Load
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Child Profiles Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className={cn('text-[10px] uppercase tracking-widest font-mono flex items-center gap-2', theme === 'dark' ? 'text-jyotish-gold/60' : 'text-slate-400')}>
              <Users className="w-3 h-3" /> People Profiles ({childProfiles.length}/{MAX_PROFILES})
            </div>
            {!showForm && (
              <button
                onClick={openAddForm}
                disabled={childProfiles.length >= MAX_PROFILES}
                title={childProfiles.length >= MAX_PROFILES ? `Maximum ${MAX_PROFILES} profiles reached` : 'Add profile'}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-widest font-bold transition-all',
                  childProfiles.length >= MAX_PROFILES
                    ? theme === 'dark' ? 'opacity-30 cursor-not-allowed bg-white/5 border-white/10 text-white/40' : 'opacity-30 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                    : 'bg-jyotish-gold text-black border-jyotish-gold hover:bg-celestial-gold shadow-lg shadow-jyotish-gold/20'
                )}
              >
                <Plus className="w-3 h-3" /> Add Profile
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(cardBase, 'mb-4 border-jyotish-gold/30 ring-1 ring-jyotish-gold/20')}
              >
                <div className={cn('text-[10px] uppercase tracking-widest font-mono mb-5 flex items-center gap-2', theme === 'dark' ? 'text-jyotish-gold/60' : 'text-slate-400')}>
                  <Sparkles className="w-3 h-3 text-jyotish-gold" />
                  {editingId ? 'Edit Profile' : 'New Profile'}
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className={cn('block text-[10px] font-mono uppercase tracking-widest', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Emma Johnson"
                      value={formData.name}
                      onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
                      className={cn(
                        'w-full p-3.5 rounded-2xl border text-sm focus:ring-2 focus:ring-jyotish-gold/50 outline-none transition-all',
                        theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      )}
                    />
                  </div>

                  {/* Birth Date & Time */}
                  <div className="space-y-1.5">
                    <label className={cn('block text-[10px] font-mono uppercase tracking-widest', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>Birth Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      value={formData.birthTime}
                      onChange={(e) => setFormData(d => ({ ...d, birthTime: e.target.value }))}
                      className={cn(
                        'w-full p-3.5 rounded-2xl border text-sm font-mono focus:ring-2 focus:ring-jyotish-gold/50 outline-none transition-all',
                        theme === 'dark' ? 'bg-black/40 border-white/10 text-white [color-scheme:dark]' : 'bg-slate-50 border-slate-200 text-slate-900 [color-scheme:light]'
                      )}
                    />
                  </div>

                  {/* Birth City */}
                  <div className="space-y-1.5">
                    <label className={cn('block text-[10px] font-mono uppercase tracking-widest', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>Birth City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-jyotish-gold/40" />
                      <input
                        type="text"
                        placeholder="e.g. New Delhi, India"
                        value={formData.city}
                        onChange={(e) => setFormData(d => ({ ...d, city: e.target.value }))}
                        onFocus={() => { if (citySuggestions.length > 0) setShowCitySuggestions(true); }}
                        className={cn(
                          'w-full p-3.5 pl-10 rounded-2xl border text-sm focus:ring-2 focus:ring-jyotish-gold/50 outline-none transition-all',
                          theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        )}
                      />
                      {isCitySearching && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-jyotish-gold animate-spin" />
                      )}
                      <AnimatePresence>
                        {showCitySuggestions && citySuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className={cn(
                              'absolute left-0 right-0 top-full mt-2 rounded-2xl border z-[100] overflow-hidden shadow-2xl backdrop-blur-xl',
                              theme === 'dark' ? 'bg-black/90 border-white/10' : 'bg-white/95 border-slate-200'
                            )}
                          >
                            {citySuggestions.map((c, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  const label = `${c.name}${c.admin1 ? `, ${c.admin1}` : ''}, ${c.country}`;
                                  setFormData(d => ({ ...d, city: label }));
                                  setShowCitySuggestions(false);
                                }}
                                className={cn(
                                  'w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors',
                                  theme === 'dark' ? 'hover:bg-white/10 text-white/80' : 'hover:bg-slate-100 text-slate-700'
                                )}
                              >
                                <MapPin className="w-3 h-3 text-jyotish-gold shrink-0" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{c.name}</span>
                                  <span className="text-[10px] opacity-60">{c.admin1 ? `${c.admin1}, ` : ''}{c.country}</span>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {formError && (
                    <p className="text-xs text-red-500 font-mono">{formError}</p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={cancelForm}
                      className={cn(
                        'flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest border transition-all active:scale-95',
                        theme === 'dark' ? 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-[2] py-3 rounded-2xl bg-jyotish-gold text-black text-xs font-bold uppercase tracking-widest hover:bg-celestial-gold transition-all shadow-lg shadow-jyotish-gold/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {isSaving ? 'Saving...' : editingId ? 'Update Profile' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Cards */}
          {childProfiles.length === 0 && !showForm && (
            <div className={cn(
              'rounded-3xl border border-dashed p-10 text-center',
              theme === 'dark' ? 'border-white/10' : 'border-slate-200'
            )}>
              <Users className={cn('w-10 h-10 mx-auto mb-3', theme === 'dark' ? 'text-white/20' : 'text-slate-300')} />
              <p className={cn('text-sm', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>No profiles yet</p>
              <p className={cn('text-xs mt-1', theme === 'dark' ? 'text-white/20' : 'text-slate-300')}>Add up to {MAX_PROFILES} profiles for family &amp; friends</p>
              <button
                onClick={openAddForm}
                className="mt-4 px-5 py-2.5 rounded-full bg-jyotish-gold text-black text-xs font-bold uppercase tracking-widest hover:bg-celestial-gold transition-all shadow-lg shadow-jyotish-gold/20 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" /> Add First Profile
              </button>
            </div>
          )}

          <div className="space-y-3">
            {childProfiles.map((profile) => {
              const isActive = activeChildProfileId === profile.id;
              return (
                <motion.div
                  key={profile.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    cardBase,
                    isActive ? 'ring-2 ring-jyotish-gold/40 border-jyotish-gold/30' : ''
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <UserIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn('font-bold truncate', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
                        {profile.name}
                      </div>
                      <div className={cn('text-xs font-mono mt-0.5 flex items-center gap-2', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
                        <Calendar className="w-3 h-3 shrink-0" />
                        {format(new Date(profile.birthTime), 'MMM d, yyyy • HH:mm')}
                      </div>
                      <div className={cn('text-xs font-mono mt-0.5 flex items-center gap-2', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
                        <MapPin className="w-3 h-3 shrink-0" />
                        {profile.city}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-jyotish-gold/10 border border-jyotish-gold/30 text-jyotish-gold text-[10px] uppercase tracking-widest font-bold">
                          <Check className="w-3 h-3" /> Active
                        </div>
                      ) : (
                        <button
                          onClick={() => onLoadProfile(profile.id)}
                          className="px-3 py-1.5 rounded-full bg-jyotish-gold text-black border border-jyotish-gold text-[10px] uppercase tracking-widest font-bold hover:bg-celestial-gold transition-all"
                        >
                          Load
                        </button>
                      )}

                      {/* Edit */}
                      {!showForm && (
                        <button
                          onClick={() => openEditForm(profile)}
                          className={cn(
                            'p-2 rounded-xl border transition-colors',
                            theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 hover:text-jyotish-gold hover:bg-jyotish-gold/10 hover:border-jyotish-gold/30' : 'bg-white border-slate-200 text-slate-400 hover:text-orange-500 hover:bg-orange-50 shadow-sm'
                          )}
                          title="Edit profile"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete */}
                      {deletingId === profile.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(profile.id)}
                            disabled={isDeleting}
                            className="px-2 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                          >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Delete
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className={cn(
                              'px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                              theme === 'dark' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                            )}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        !showForm && (
                          <button
                            onClick={() => setDeletingId(profile.id)}
                            className={cn(
                              'p-2 rounded-xl border transition-colors',
                              theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20' : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 shadow-sm'
                            )}
                            title="Delete profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Capacity hint */}
          {childProfiles.length > 0 && childProfiles.length < MAX_PROFILES && !showForm && (
            <p className={cn('text-center text-[10px] font-mono mt-4', theme === 'dark' ? 'text-white/20' : 'text-slate-300')}>
              {MAX_PROFILES - childProfiles.length} slot{MAX_PROFILES - childProfiles.length !== 1 ? 's' : ''} remaining
            </p>
          )}
        </section>

      </div>
    </div>
  );
};

export default ProfilesPage;
