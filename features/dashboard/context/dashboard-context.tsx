"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import type { Dictionary } from "@/lib/i18n/dictionaries";

const SIDEBAR_KEY = "zt:sidebar:collapsed";

export interface DashboardContextValue {
  isMobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  navLabels: Dictionary["dashboardNav"];
}

export const DashboardContext = createContext<DashboardContextValue | null>(
  null,
);

const DEFAULT_NAV_LABELS: Dictionary["dashboardNav"] = {
  dashboard: "Dashboard",
  projects: "Projects",
  apiKeys: "API Keys",
  errors: "Error Monitoring",
  incidents: "Incidents",
  health: "Health Monitor",
  insights: "Intelligence",
  ai: "AI Assistant",
  notifications: "Notifications",
  statusPages: "Status Pages",
  members: "Members",
  audit: "Audit Log",
  security: "Security Center",
  organization: "Organization",
  billing: "Billing",
  settings: "Settings",
  profile: "Profile",
};

export function DashboardProvider({
  children,
  navLabels = DEFAULT_NAV_LABELS,
}: {
  children: ReactNode;
  navLabels?: Dictionary["dashboardNav"];
}) {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Restore the persisted sidebar preference after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_KEY) === "1") {
        setSidebarCollapsed(true);
      }
    } catch {
      // localStorage unavailable — keep the default expanded state.
    }
  }, []);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const toggleMobileNav = useCallback(
    () => setMobileNavOpen((open) => !open),
    [],
  );
  const toggleSidebar = useCallback(
    () =>
      setSidebarCollapsed((collapsed) => {
        const next = !collapsed;
        try {
          window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
        } catch {
          // best-effort persistence only
        }
        return next;
      }),
    [],
  );

  const value = useMemo<DashboardContextValue>(
    () => ({
      isMobileNavOpen,
      openMobileNav,
      closeMobileNav,
      toggleMobileNav,
      isSidebarCollapsed,
      toggleSidebar,
      navLabels,
    }),
    [
      isMobileNavOpen,
      openMobileNav,
      closeMobileNav,
      toggleMobileNav,
      isSidebarCollapsed,
      toggleSidebar,
      navLabels,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
