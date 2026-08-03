"use client";

import { useContext } from "react";

import { DashboardContext } from "@/features/dashboard/context/dashboard-context";
import type { DashboardContextValue } from "@/features/dashboard/context/dashboard-context";

/** Access the dashboard shell state. Must be used within a DashboardProvider. */
export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
