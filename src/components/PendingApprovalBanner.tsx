import React from 'react';
import { Clock } from 'lucide-react';

export const PendingApprovalBanner: React.FC = () => {
  return (
    <div className="sticky top-0 z-50 w-full bg-amber-900/70 backdrop-blur-sm border-b border-amber-600/40 px-4 py-2.5 flex items-center justify-center gap-2.5 text-amber-200">
      <Clock className="w-4 h-4 shrink-0 text-amber-400" />
      <p className="text-xs font-mono uppercase tracking-widest text-center">
        Your account is <span className="text-amber-400 font-semibold">pending admin approval</span>.
        Save and AI features are disabled until approved.
      </p>
    </div>
  );
};
