import type { LucideIcon } from 'lucide-react';
import { Briefcase, CalendarDays, UserRound } from 'lucide-react';

export interface FreeReportLink {
  id: 'career' | 'personal' | 'daily';
  icon: LucideIcon;
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  seoLabel: string;
  highlights: Array<{ label: string; detail: string }>;
}

/** Plain-language copy for the three public calculators — shared by landing sections and SEO. */
export const FREE_REPORTS: FreeReportLink[] = [
  {
    id: 'career',
    icon: Briefcase,
    href: '/career',
    eyebrow: 'Career',
    title: 'Your work path and professional strengths',
    description:
      'See where you thrive at work, what kind of roles fit your temperament, and which life chapters favor career moves — from your birth details alone.',
    cta: 'Get your free career report',
    seoLabel: 'Free career path report',
    highlights: [
      { label: 'Work fit', detail: 'Roles and environments that match your temperament' },
      { label: 'Timing windows', detail: 'When to push forward vs. consolidate' },
      { label: 'Strength map', detail: 'Professional gifts and growth edges' },
    ],
  },
  {
    id: 'daily',
    icon: CalendarDays,
    href: '/daily',
    eyebrow: 'Daily',
    title: 'Today\'s emotional weather and week ahead',
    description:
      'Check your daily energy, mood tone, and best timing windows for the next seven days — personalized to your chart and where you are right now.',
    cta: 'Get your free daily report',
    seoLabel: 'Free daily energy report',
    highlights: [
      { label: 'Today\'s energy', detail: 'Mind, body, and mood for the day' },
      { label: '7-day forecast', detail: 'Upcoming highs, lows, and pacing' },
      { label: 'Practical moves', detail: 'Plain-language coaching for the week' },
    ],
  },
  {
    id: 'personal',
    icon: UserRound,
    href: '/personal',
    eyebrow: 'Personal',
    title: 'Your personality blueprint and inner landscape',
    description:
      'Explore how you show up outwardly vs. inwardly, your core motivations, life themes, and recurring blind spots — a calm snapshot of who you are.',
    cta: 'Get your free personal report',
    seoLabel: 'Free personality blueprint report',
    highlights: [
      { label: 'Personality wheel', detail: 'How you think, feel, and relate' },
      { label: 'Inner vs outer self', detail: 'Public face and private needs' },
      { label: 'Life mission', detail: 'Themes that keep showing up' },
    ],
  },
];
