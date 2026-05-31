import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Loader2, ShieldAlert, Users, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  db,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from '../firebase';
import type { User } from '../firebase';

interface PendingUser {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
}

interface AdminPageProps {
  user: User;
  userProfile: any;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ user, userProfile, theme, onClose }) => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loadingUids, setLoadingUids] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(
      collection(db, 'pendingUsers'),
      (snapshot) => {
        const users: PendingUser[] = snapshot.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as Omit<PendingUser, 'uid'>),
        }));
        users.sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
        setPendingUsers(users);
        setIsLoading(false);
      },
      (err) => {
        console.error('AdminPage: failed to subscribe to pendingUsers', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const setLoadingFor = (uid: string, loading: boolean) => {
    setLoadingUids((prev) => {
      const next = new Set(prev);
      loading ? next.add(uid) : next.delete(uid);
      return next;
    });
  };

  const handleApprove = async (uid: string) => {
    setLoadingFor(uid, true);
    try {
      await updateDoc(doc(db, 'users', uid), { approvalStatus: 'approved' });
      await deleteDoc(doc(db, 'pendingUsers', uid));
    } catch (err) {
      console.error('AdminPage: approve failed', err);
    } finally {
      setLoadingFor(uid, false);
    }
  };

  const handleReject = async (uid: string) => {
    setLoadingFor(uid, true);
    try {
      await deleteDoc(doc(db, 'pendingUsers', uid));
    } catch (err) {
      console.error('AdminPage: reject failed', err);
    } finally {
      setLoadingFor(uid, false);
    }
  };

  const isDark = theme === 'dark';

  if (!isAdmin) {
    return (
      <div className={cn('min-h-screen flex flex-col items-center justify-center gap-4', isDark ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900')}>
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <p className="font-mono text-sm uppercase tracking-widest text-red-400">Access Denied</p>
        <button onClick={onClose} className="mt-4 text-xs font-mono uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen font-sans transition-colors duration-500', isDark ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900')}>
      {/* Header */}
      <div className={cn('sticky top-0 z-40 border-b px-6 py-4 flex items-center justify-between backdrop-blur-sm', isDark ? 'bg-[#050505]/90 border-white/5' : 'bg-white/90 border-slate-100')}>
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-jyotish-gold" />
          <h1 className="font-serif italic font-bold text-lg">Admin Panel</h1>
        </div>
        <button
          onClick={onClose}
          className={cn('text-xs font-mono uppercase tracking-widest transition-colors', isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-700')}
        >
          ← Back to App
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Stats row */}
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border text-sm', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
            <Users className="w-4 h-4 text-jyotish-gold" />
            <span className={cn('font-mono text-xs uppercase tracking-widest', isDark ? 'text-white/60' : 'text-slate-500')}>Pending</span>
            <span className="font-bold text-jyotish-gold">{pendingUsers.length}</span>
          </div>
        </div>

        {/* Pending users list */}
        <section>
          <h2 className={cn('text-[10px] uppercase tracking-[0.2em] font-mono mb-4', isDark ? 'text-white/30' : 'text-slate-400')}>
            Awaiting Approval
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-jyotish-gold animate-spin" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className={cn('text-center py-12 rounded-2xl border', isDark ? 'border-white/5 text-white/30' : 'border-slate-100 text-slate-400')}>
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-green-500" />
              <p className="text-xs font-mono uppercase tracking-widest">No pending registrations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => {
                const isWorking = loadingUids.has(u.uid);
                const registeredAt = u.createdAt?.toDate();
                return (
                  <motion.div
                    key={u.uid}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={cn(
                      'flex items-center justify-between gap-4 p-4 rounded-2xl border transition-colors',
                      isDark ? 'bg-white/[0.03] border-white/8 hover:bg-white/[0.06]' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold', isDark ? 'bg-jyotish-gold/10 text-jyotish-gold' : 'bg-amber-50 text-amber-600')}>
                        {(u.displayName || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-900')}>
                          {u.displayName || '(no name)'}
                        </p>
                        <p className={cn('text-xs truncate', isDark ? 'text-white/40' : 'text-slate-500')}>{u.email}</p>
                        {registeredAt && (
                          <div className={cn('flex items-center gap-1 mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-mono">{registeredAt.toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(u.uid)}
                        disabled={isWorking}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 transition-colors text-xs font-mono uppercase tracking-widest disabled:opacity-50"
                      >
                        {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(u.uid)}
                        disabled={isWorking}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors text-xs font-mono uppercase tracking-widest disabled:opacity-50"
                      >
                        {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Reject
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Bootstrap note */}
        <div className={cn('rounded-2xl border p-4 text-xs', isDark ? 'bg-white/[0.02] border-white/5 text-white/30' : 'bg-slate-50 border-slate-100 text-slate-400')}>
          <p className="font-mono uppercase tracking-widest text-[10px] mb-1">Admin Setup</p>
          <p>To grant admin access to another user, set <code className={cn('px-1 py-0.5 rounded text-[10px]', isDark ? 'bg-white/10' : 'bg-slate-200')}>role: "admin"</code> on their document in Firebase Console → Firestore → <code className={cn('px-1 py-0.5 rounded text-[10px]', isDark ? 'bg-white/10' : 'bg-slate-200')}>users/{'{uid}'}</code>.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
