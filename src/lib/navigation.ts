import {
  Compass,
  LayoutDashboard,
  LayoutGrid,
  BookOpen,
  MessageSquare,
  CircleDot,
  FileText,
  Users,
  Settings,
  ShieldAlert,
  Grid,
  type LucideIcon,
} from 'lucide-react';

export type NavId =
  | 'sky'
  | 'chart'
  | 'overview'
  | 'stats'
  | 'archives'
  | 'chat'
  | 'sudarshana'
  | 'report'
  | 'profiles'
  | 'profile'
  | 'admin';

export interface NavItem {
  id: NavId;
  label: string;
  path: string;
  icon: LucideIcon;
  surfaces: {
    desktopNav?: boolean;
    mobileBar?: boolean;
    moreSheet?: boolean;
    accountMenu?: boolean;
  };
  adminOnly?: boolean;
}

/**
 * Single source of truth for the app's information architecture. Every
 * destination declares which nav surfaces it appears on, so desktop,
 * tablet, mobile bar and the account/more menus stay in sync instead of
 * drifting into inconsistent item sets.
 *
 * Mobile (V2 shell): exclusive Sky / Kundli / Insights + AI Chat, with More
 * for overflow destinations. Desktop keeps Overview as the dual-pane home.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: 'sky', label: 'Sky Map', path: '/sky', icon: Compass, surfaces: { mobileBar: true } },
  { id: 'chart', label: 'Kundli', path: '/kundli', icon: Grid, surfaces: { mobileBar: true } },
  { id: 'overview', label: 'Overview', path: '/overview', icon: LayoutDashboard, surfaces: { desktopNav: true } },
  { id: 'stats', label: 'Insights', path: '/insights', icon: LayoutGrid, surfaces: { mobileBar: true } },
  { id: 'archives', label: 'Journal', path: '/journal', icon: BookOpen, surfaces: { desktopNav: true, moreSheet: true } },
  { id: 'chat', label: 'AI Chat', path: '/chat', icon: MessageSquare, surfaces: { desktopNav: true, mobileBar: true } },
  { id: 'sudarshana', label: 'Sudarshana Chakra', path: '/sudarshana', icon: CircleDot, surfaces: { desktopNav: true, moreSheet: true } },
  { id: 'report', label: 'Full Report', path: '/report', icon: FileText, surfaces: { desktopNav: true, moreSheet: true, accountMenu: true } },
  { id: 'profiles', label: 'People', path: '/people', icon: Users, surfaces: { moreSheet: true, accountMenu: true } },
  { id: 'profile', label: 'Settings', path: '/settings', icon: Settings, surfaces: { moreSheet: true, accountMenu: true } },
  { id: 'admin', label: 'Admin', path: '/admin', icon: ShieldAlert, surfaces: { moreSheet: true, accountMenu: true }, adminOnly: true },
];

export const DEFAULT_NAV_ID: NavId = 'sky';

/** Legacy path aliases → canonical NavId */
const PATH_ALIASES: Record<string, NavId> = {
  '/data': 'stats',
  '/chart': 'chart',
};

export function navItemsFor(surface: keyof NavItem['surfaces'], isAdmin: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => item.surfaces[surface] && (!item.adminOnly || isAdmin));
}

export function pathToNavId(pathname: string): NavId | null {
  if (PATH_ALIASES[pathname]) return PATH_ALIASES[pathname];
  const match = NAV_ITEMS.find((item) => item.path === pathname);
  return match ? match.id : null;
}

export function navIdToPath(id: NavId): string {
  const match = NAV_ITEMS.find((item) => item.id === id);
  return match ? match.path : '/sky';
}

/** Destinations that live behind the mobile "More" sheet — used to highlight its trigger. */
export const MORE_SHEET_IDS = new Set<NavId>(
  NAV_ITEMS.filter((item) => item.surfaces.moreSheet).map((item) => item.id)
);

/** Tabs where the floating celestial controls HUD is eligible on mobile. */
export const CONTROLS_HUD_IDS = new Set<NavId>(['sky']);
