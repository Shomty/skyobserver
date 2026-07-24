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
  type LucideIcon,
} from 'lucide-react';

export type NavId =
  | 'sky'
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
 */
export const NAV_ITEMS: NavItem[] = [
  // The sky map / kundali and the data dashboard now live on a single 50:50
  // "Overview" page. `sky` and `stats` are kept only as legacy routable paths
  // (they render the same unified page) so existing /sky and /data links resolve.
  { id: 'sky', label: 'Sky', path: '/sky', icon: Compass, surfaces: {} },
  { id: 'overview', label: 'Overview', path: '/overview', icon: LayoutDashboard, surfaces: { desktopNav: true, mobileBar: true } },
  { id: 'stats', label: 'Data', path: '/data', icon: LayoutGrid, surfaces: {} },
  { id: 'archives', label: 'Journal', path: '/journal', icon: BookOpen, surfaces: { desktopNav: true, mobileBar: true } },
  { id: 'chat', label: 'AI Chat', path: '/chat', icon: MessageSquare, surfaces: { desktopNav: true, mobileBar: true } },
  { id: 'sudarshana', label: 'Sudarshana Chakra', path: '/sudarshana', icon: CircleDot, surfaces: { desktopNav: true, moreSheet: true } },
  { id: 'report', label: 'Full Report', path: '/report', icon: FileText, surfaces: { desktopNav: true, moreSheet: true, accountMenu: true } },
  { id: 'profiles', label: 'People', path: '/people', icon: Users, surfaces: { moreSheet: true, accountMenu: true } },
  { id: 'profile', label: 'Settings', path: '/settings', icon: Settings, surfaces: { moreSheet: true, accountMenu: true } },
  { id: 'admin', label: 'Admin', path: '/admin', icon: ShieldAlert, surfaces: { moreSheet: true, accountMenu: true }, adminOnly: true },
];

export const DEFAULT_NAV_ID: NavId = 'overview';

export function navItemsFor(surface: keyof NavItem['surfaces'], isAdmin: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => item.surfaces[surface] && (!item.adminOnly || isAdmin));
}

export function pathToNavId(pathname: string): NavId | null {
  const match = NAV_ITEMS.find((item) => item.path === pathname);
  return match ? match.id : null;
}

export function navIdToPath(id: NavId): string {
  const match = NAV_ITEMS.find((item) => item.id === id);
  return match ? match.path : '/overview';
}

/** Destinations that live behind the mobile "More" sheet — used to highlight its trigger. */
export const MORE_SHEET_IDS = new Set<NavId>(
  NAV_ITEMS.filter((item) => item.surfaces.moreSheet).map((item) => item.id)
);
