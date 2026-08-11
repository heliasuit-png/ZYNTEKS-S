import type { ReactNode } from "react";

/**
 * Dashboard segment template.
 *
 * Intentionally plain (no Framer Motion). Animated page wrappers remount and
 * mutate the DOM during AI stream commits, which races React's reconciler and
 * surfaces as:
 *   NotFoundError: Failed to execute 'insertBefore' on 'Node'
 * That error hits the dashboard error boundary and wipes the live chat UI
 * while the answer is already persisted in history.
 */
export default function DashboardTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return <div>{children}</div>;
}
