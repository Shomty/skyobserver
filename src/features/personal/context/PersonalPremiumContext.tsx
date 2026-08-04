import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { usePersonalPremiumAccessState } from '../hooks/usePersonalPremiumAccessState';
import { resolvePersonalPremiumUnlocked } from '../lib/personalPremiumAccess';

interface PersonalPremiumValue {
  premiumUnlocked: boolean;
  setReportEmail: (email: string | null) => void;
}

const PersonalPremiumContext = createContext<PersonalPremiumValue>({
  premiumUnlocked: false,
  setReportEmail: () => {},
});

export function PersonalPremiumProvider({ children }: { children: ReactNode }) {
  const { premiumUnlocked: signedInUnlocked } = usePersonalPremiumAccessState();
  const [reportEmail, setReportEmail] = useState<string | null>(null);

  const value = useMemo<PersonalPremiumValue>(
    () => ({
      premiumUnlocked: resolvePersonalPremiumUnlocked(signedInUnlocked, reportEmail),
      setReportEmail,
    }),
    [signedInUnlocked, reportEmail],
  );

  return <PersonalPremiumContext.Provider value={value}>{children}</PersonalPremiumContext.Provider>;
}

export function usePersonalPremiumUnlocked(): boolean {
  return useContext(PersonalPremiumContext).premiumUnlocked;
}

export function useSetPersonalPremiumEmail(): (email: string | null) => void {
  return useContext(PersonalPremiumContext).setReportEmail;
}
