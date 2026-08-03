"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Dashboard page transition. Next.js remounts this template on every navigation
 * within the (dashboard) segment, so a plain entrance animation gives every
 * route a smooth fade + slide + scale. Honors prefers-reduced-motion via the
 * global stylesheet and Framer's own reduced-motion handling.
 */
export default function DashboardTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.994 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
