import {
  LayoutGrid,
  Compass,
  Zap,
  Edit,
  Activity,
  Sparkles,
  User as UserIcon,
  CalendarDays,
  Clock,
  Grid,
  Layers,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

export type DashboardTabId =
  | 'overview'
  | 'yogas'
  | 'transits'
  | 'natal'
  | 'upcoming'
  | 'panchang'
  | 'ashtakavarga'
  | 'muhurta'
  | 'dashas'
  | 'impacts'
  | 'blueprint'
  | 'rectify'
  | 'vargas';

export type DashboardGroup = 'Now' | 'Birth Chart' | 'Timing' | 'Analysis';

export interface DashboardTabDef {
  id: DashboardTabId;
  label: string;
  icon: LucideIcon;
  group: DashboardGroup;
  /** Tabs without this are available in either Natal or Transit mode. */
  requiredMode?: 'natal' | 'transit';
}

/**
 * Grouped tab registry for the data dashboard. Unlike the previous flat list
 * (which hid tabs outright when the Natal/Transit mode didn't match), every
 * tab here is always rendered — off-mode tabs just carry a `requiredMode`
 * so the dashboard can badge them and auto-switch mode on click instead of
 * making them disappear silently.
 */
export const DASHBOARD_TABS: DashboardTabDef[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, group: 'Now' },
  { id: 'panchang', label: 'Panchang', icon: Clock, group: 'Now' },
  { id: 'transits', label: 'Transits', icon: Activity, group: 'Now', requiredMode: 'transit' },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarDays, group: 'Now', requiredMode: 'transit' },
  { id: 'muhurta', label: 'Muhurta', icon: CheckCircle2, group: 'Now', requiredMode: 'transit' },
  { id: 'blueprint', label: 'Blueprint', icon: Compass, group: 'Birth Chart', requiredMode: 'natal' },
  { id: 'natal', label: 'Birth', icon: UserIcon, group: 'Birth Chart', requiredMode: 'natal' },
  { id: 'vargas', label: 'Vargas', icon: Layers, group: 'Birth Chart', requiredMode: 'natal' },
  { id: 'ashtakavarga', label: 'Ashtaka', icon: Grid, group: 'Birth Chart', requiredMode: 'natal' },
  { id: 'dashas', label: 'Dashas', icon: Zap, group: 'Timing', requiredMode: 'natal' },
  { id: 'yogas', label: 'Yogas', icon: Sparkles, group: 'Analysis', requiredMode: 'natal' },
  { id: 'impacts', label: 'Impacts', icon: Activity, group: 'Analysis', requiredMode: 'natal' },
  { id: 'rectify', label: 'Rectify', icon: Edit, group: 'Analysis', requiredMode: 'natal' },
];
