import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2, XCircle, Loader2, ShieldAlert, Users, Clock,
  ChevronDown, ChevronUp, Mail, MapPin, Calendar, User2, Key,
  AlertTriangle, RefreshCw, Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  db, auth,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  sendPasswordResetEmail,
} from '../firebase';
import type { User } from '../firebase';

// ---------- types ----------

interface PendingUser {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
}

interface BirthDetails {
  time?: string;
  lat?: number;
  lon?: number;
  city?: string;
}

interface SavedChart {
  id: string;
  name?: string;
  time?: string;
  lat?: number;
  lon?: number;
  city?: string;
  createdAt?: Timestamp;
}

interface AllUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  role?: string;
  approvalStatus?: string;
  onboardingCompleted?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  birthDetails?: BirthDetails;
  savedCharts?: SavedChart[];
}

interface AdminPageProps {
  user: User;
  userProfile: any;
  theme: 'light' | 'dark';
  onClose: () => void;
}

// ---------- helpers ----------

type StatusKey = 'pending' | 'approved' | 'admin';

function statusBadge(u: AllUser): StatusKey {
  if (u.role === 'admin') return 'admin';
  if (u.approvalStatus === 'pending') return 'pending';
  return 'approved';
}

function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

const STATUS_STYLES: Record<StatusKey, string> = {
  pending:  'bg-amber-500/10 border-amber-500/20 text-amber-500',
  approved: 'bg-green-500/10 border-green-500/20 text-green-500',
  admin:    'bg-purple-500/10 border-purple-500/20 text-purple-400',
};

// ---------- sub-components ----------

function StatusBadge({ status }: { status: StatusKey }) {
  const label = status === 'admin' ? 'Admin' : status === 'pending' ? 'Pending' : 'Approved';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-mono uppercase tracking-widest', STATUS_STYLES[status])}>
      {label}
    </span>
  );
}

function ConfirmDialog({
  message, onConfirm, onCancel, isDark,
}: { message: string; onConfirm: () => void; onCancel: () => void; isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'absolute inset-0 z-50 flex items-center justify-center rounded-2xl',
        isDark ? 'bg-[#050505]/95' : 'bg-white/95',
      )}
    >
      <div className="text-center space-y-4 px-6">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <p className={cn('text-sm', isDark ? 'text-white/80' : 'text-slate-700')}>{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className={cn('px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest border transition-colors', isDark ? 'border-white/10 text-white/40 hover:text-white/70' : 'border-slate-200 text-slate-500 hover:text-slate-700')}
          >Cancel</button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors"
          >Confirm</button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------- User Detail Panel ----------

interface UserDetailProps {
  u: AllUser;
  isDark: boolean;
  onApprove?: (uid: string) => Promise<void>;
  onReject?: (uid: string) => Promise<void>;
  onResetPassword?: (email: string) => Promise<void>;
  working: boolean;
}

function UserDetail({ u, isDark, onApprove, onReject, onResetPassword, working }: UserDetailProps) {
  const [confirm, setConfirm] = useState<null | 'reject' | 'reset'>(null);
  const status = statusBadge(u);
  const bd = u.birthDetails;

  const cell = (label: string, value: string | undefined) => (
    <div>
      <p className={cn('text-[9px] uppercase tracking-widest font-mono mb-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>{label}</p>
      <p className={cn('text-xs', isDark ? 'text-white/70' : 'text-slate-700')}>{value || '—'}</p>
    </div>
  );

  return (
    <div className={cn('relative mt-0 rounded-b-2xl border-t p-4 space-y-4', isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100')}>
      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            isDark={isDark}
            message={confirm === 'reject'
              ? `Remove ${u.displayName || u.email} from pending queue?`
              : `Send password reset email to ${u.email}?`}
            onCancel={() => setConfirm(null)}
            onConfirm={() => {
              if (confirm === 'reject') onReject?.(u.uid);
              if (confirm === 'reset') onResetPassword?.(u.email!);
              setConfirm(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Identity */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {cell('Email', u.email)}
        {cell('Display Name', u.displayName)}
        {cell('First Name', u.firstName)}
        {cell('Last Name', u.lastName)}
        {cell('Gender', u.gender)}
        {cell('Role', u.role || 'user')}
        {cell('Status', u.approvalStatus || 'approved')}
        {cell('Registered', formatDate(u.createdAt))}
        {cell('Onboarding', u.onboardingCompleted ? 'Complete' : 'Pending')}
        {cell('Charts saved', String(u.savedCharts?.length ?? 0))}
      </div>

      {/* Birth details */}
      {bd && (
        <div>
          <p className={cn('text-[9px] uppercase tracking-widest font-mono mb-2', isDark ? 'text-white/25' : 'text-slate-400')}>Birth Details</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {cell('Date & Time', formatDateTime(bd.time))}
            {cell('City', bd.city)}
            {cell('Latitude', bd.lat != null ? bd.lat.toFixed(4) : undefined)}
            {cell('Longitude', bd.lon != null ? bd.lon.toFixed(4) : undefined)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {status === 'pending' && onApprove && (
          <button
            onClick={() => onApprove(u.uid)}
            disabled={working}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 transition-colors text-xs font-mono uppercase tracking-widest disabled:opacity-50"
          >
            {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Approve
          </button>
        )}
        {status === 'pending' && onReject && (
          <button
            onClick={() => setConfirm('reject')}
            disabled={working}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors text-xs font-mono uppercase tracking-widest disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
        )}
        {u.email && (
          <button
            onClick={() => setConfirm('reset')}
            disabled={working}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors text-xs font-mono uppercase tracking-widest disabled:opacity-50', isDark ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 shadow-sm')}
          >
            <Key className="w-3.5 h-3.5" />
            Send Reset Email
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Main component ----------

type Tab = 'pending' | 'all';

const AdminPage: React.FC<AdminPageProps> = ({ user, userProfile, theme, onClose }) => {
  const [tab, setTab] = useState<Tab>('pending');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [loadingUids, setLoadingUids] = useState<Set<string>>(new Set());
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [isAllLoading, setIsAllLoading] = useState(true);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isAdmin = userProfile?.role === 'admin';
  const isDark = theme === 'dark';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Real-time pending queue
  useEffect(() => {
    if (!isAdmin) return;
    return onSnapshot(
      collection(db, 'pendingUsers'),
      (snap) => {
        const users: PendingUser[] = snap.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as Omit<PendingUser, 'uid'>),
        }));
        users.sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
        setPendingUsers(users);
        setIsPendingLoading(false);
      },
      (err) => { console.error('AdminPage pendingUsers', err); setIsPendingLoading(false); }
    );
  }, [isAdmin]);

  // Real-time all users
  useEffect(() => {
    if (!isAdmin) return;
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const users: AllUser[] = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AllUser, 'uid'>) }));
        users.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setAllUsers(users);
        setIsAllLoading(false);
      },
      (err) => { console.error('AdminPage allUsers', err); setIsAllLoading(false); }
    );
  }, [isAdmin]);

  const setLoadingFor = (uid: string, loading: boolean) =>
    setLoadingUids((prev) => { const s = new Set(prev); loading ? s.add(uid) : s.delete(uid); return s; });

  const handleApprove = async (uid: string) => {
    setLoadingFor(uid, true);
    try {
      await updateDoc(doc(db, 'users', uid), { approvalStatus: 'approved' });
      await deleteDoc(doc(db, 'pendingUsers', uid));
      showToast('User approved ✓');
    } catch (err) { console.error('approve', err); }
    finally { setLoadingFor(uid, false); }
  };

  const handleReject = async (uid: string) => {
    setLoadingFor(uid, true);
    try {
      await deleteDoc(doc(db, 'pendingUsers', uid));
      showToast('User rejected');
    } catch (err) { console.error('reject', err); }
    finally { setLoadingFor(uid, false); }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showToast(`Reset email sent to ${email}`);
    } catch (err) { console.error('resetPassword', err); showToast('Failed to send reset email'); }
  };

  if (!isAdmin) {
    return (
      <div className={cn('min-h-screen flex flex-col items-center justify-center gap-4', isDark ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900')}>
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <p className="font-mono text-sm uppercase tracking-widest text-red-400">Access Denied</p>
        <button onClick={onClose} className="mt-4 text-xs font-mono uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors">← Back</button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: pendingUsers.length },
    { key: 'all',     label: 'All Users', count: allUsers.length },
  ];

  return (
    <div className={cn('min-h-screen font-sans transition-colors duration-500', isDark ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900')}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-jyotish-gold text-black text-xs font-mono uppercase tracking-widest shadow-lg"
          >{toast}</motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className={cn('sticky top-0 z-40 border-b px-6 py-4 flex items-center justify-between backdrop-blur-sm', isDark ? 'bg-[#050505]/90 border-white/5' : 'bg-white/90 border-slate-100')}>
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-jyotish-gold" />
          <h1 className="font-serif italic font-bold text-lg">Admin Panel</h1>
        </div>
        <button onClick={onClose} className={cn('text-xs font-mono uppercase tracking-widest transition-colors', isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-700')}>
          ← Back to App
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { icon: Clock, label: 'Pending', value: pendingUsers.length, color: 'text-amber-500' },
            { icon: Users, label: 'Total Users', value: allUsers.length, color: 'text-jyotish-gold' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border text-sm', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
              <Icon className={cn('w-4 h-4', color)} />
              <span className={cn('font-mono text-xs uppercase tracking-widest', isDark ? 'text-white/60' : 'text-slate-500')}>{label}</span>
              <span className={cn('font-bold', color)}>{value}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={cn('flex gap-1 p-1 rounded-xl border', isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-100')}>
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors',
                tab === key
                  ? isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-sm'
                  : isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {label}
              {count > 0 && (
                <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-bold', tab === key ? 'bg-jyotish-gold/20 text-jyotish-gold' : isDark ? 'bg-white/10 text-white/40' : 'bg-slate-200 text-slate-500')}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ---------- PENDING TAB ---------- */}
        {tab === 'pending' && (
          <section>
            <h2 className={cn('text-[10px] uppercase tracking-[0.2em] font-mono mb-4', isDark ? 'text-white/30' : 'text-slate-400')}>Awaiting Approval</h2>

            {isPendingLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-jyotish-gold animate-spin" /></div>
            ) : pendingUsers.length === 0 ? (
              <div className={cn('text-center py-12 rounded-2xl border', isDark ? 'border-white/5 text-white/30' : 'border-slate-100 text-slate-400')}>
                <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-green-500" />
                <p className="text-xs font-mono uppercase tracking-widest">No pending registrations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingUsers.map((u) => {
                  const isWorking = loadingUids.has(u.uid);
                  return (
                    <motion.div key={u.uid} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-200 shadow-sm')}
                    >
                      <div className="flex items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold', isDark ? 'bg-jyotish-gold/10 text-jyotish-gold' : 'bg-amber-50 text-amber-600')}>
                            {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-900')}>{u.displayName || '(no name)'}</p>
                            <p className={cn('text-xs truncate', isDark ? 'text-white/40' : 'text-slate-500')}>{u.email}</p>
                            {u.createdAt && (
                              <div className={cn('flex items-center gap-1 mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
                                <Clock className="w-3 h-3" /><span className="text-[10px] font-mono">{formatDate(u.createdAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleApprove(u.uid)} disabled={isWorking}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 transition-colors text-xs font-mono uppercase tracking-widest disabled:opacity-50">
                            {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                          </button>
                          <button onClick={() => handleReject(u.uid)} disabled={isWorking}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors text-xs font-mono uppercase tracking-widest disabled:opacity-50">
                            {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ---------- ALL USERS TAB ---------- */}
        {tab === 'all' && (
          <section>
            <h2 className={cn('text-[10px] uppercase tracking-[0.2em] font-mono mb-4', isDark ? 'text-white/30' : 'text-slate-400')}>All Registered Users</h2>

            {isAllLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-jyotish-gold animate-spin" /></div>
            ) : allUsers.length === 0 ? (
              <div className={cn('text-center py-12 rounded-2xl border', isDark ? 'border-white/5 text-white/30' : 'border-slate-100 text-slate-400')}>
                <p className="text-xs font-mono uppercase tracking-widest">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allUsers.map((u) => {
                  const isWorking = loadingUids.has(u.uid);
                  const isExpanded = expandedUid === u.uid;
                  const status = statusBadge(u);
                  return (
                    <motion.div key={u.uid} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={cn('rounded-2xl border overflow-hidden transition-colors', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-200 shadow-sm')}
                    >
                      {/* Row */}
                      <button
                        onClick={() => setExpandedUid(isExpanded ? null : u.uid)}
                        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors"
                      >
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold', isDark ? 'bg-jyotish-gold/10 text-jyotish-gold' : 'bg-amber-50 text-amber-600')}>
                          {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-900')}>{u.displayName || '(no name)'}</p>
                            <StatusBadge status={status} />
                          </div>
                          <p className={cn('text-xs truncate', isDark ? 'text-white/40' : 'text-slate-500')}>{u.email}</p>
                        </div>
                        <div className={cn('flex items-center gap-2 shrink-0', isDark ? 'text-white/25' : 'text-slate-400')}>
                          <span className="text-[10px] font-mono hidden sm:block">{formatDate(u.createdAt)}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Detail panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <UserDetail
                              u={u}
                              isDark={isDark}
                              onApprove={status === 'pending' ? handleApprove : undefined}
                              onReject={status === 'pending' ? handleReject : undefined}
                              onResetPassword={handleResetPassword}
                              working={isWorking}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Bootstrap note */}
        <div className={cn('rounded-2xl border p-4 text-xs', isDark ? 'bg-white/[0.02] border-white/5 text-white/30' : 'bg-slate-50 border-slate-100 text-slate-400')}>
          <p className="font-mono uppercase tracking-widest text-[10px] mb-1">Admin Setup</p>
          <p>To promote a user to admin, set <code className={cn('px-1 py-0.5 rounded text-[10px]', isDark ? 'bg-white/10' : 'bg-slate-200')}>role: "admin"</code> on their document in Firebase Console → Firestore → <code className={cn('px-1 py-0.5 rounded text-[10px]', isDark ? 'bg-white/10' : 'bg-slate-200')}>users/{'{uid}'}</code>.</p>
        </div>

      </div>
    </div>
  );
};

export default AdminPage;
