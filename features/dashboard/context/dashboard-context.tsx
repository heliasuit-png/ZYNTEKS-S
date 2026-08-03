"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

const SIDEBAR_KEY = "zt:sidebar:collapsed";

export interface DashboardContextValue {
  isMobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const DashboardContext = createContext<DashboardContextValue | null>(
  null,
);

export function DashboardProvider({ children }: { children: ReactNode }) {
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
    }),
    [
      isMobileNavOpen,
      openMobileNav,
      closeMobileNav,
      toggleMobileNav,
      isSidebarCollapsed,
      toggleSidebar,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
