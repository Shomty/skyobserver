import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useCareerPremiumAccessState } from '../hooks/useCareerPremiumAccessState';
import { resolveCareerPremiumUnlocked } from '../lib/careerPremiumAccess';

interface CareerPremiumValue {
  premiumUnlocked: boolean;
  /** Email the current report belongs to — allowlisted test accounts unlock without signing in. */
  setReportEmail: (email: string | null) => void;
}

const CareerPremiumContext = createContext<CareerPremiumValue>({
  premiumUnlocked: false,
  setReportEmail: () => {},
});

export function CareerPremiumProvider({ children }: { children: ReactNode }) {
  const { premiumUnlocked: signedInUnlocked } = useCareerPremiumAccessState();
  const [reportEmail, setReportEmail] = useState<string | null>(null);

  const value = useMemo<CareerPremiumValue>(
    () => ({
      premiumUnlocked: resolveCareerPremiumUnlocked(signedInUnlocked, reportEmail),
      setReportEmail,
    }),
    [signedInUnlocked, reportEmail],
  );

  return <CareerPremiumContext.Provider value={value}>{children}</CareerPremiumContext.Provider>;
}

export function useCareerPremiumUnlocked(): boolean {
  return useContext(CareerPremiumContext).premiumUnlocked;
}

/** Report-scoped unlock: call with the email a report was generated for. */
export function useSetCareerPremiumEmail(): (email: string | null) => void {
  return useContext(CareerPremiumContext).setReportEmail;
}
