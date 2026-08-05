/** Shared Framer Motion presets — keep admin motion calm and consistent. */
export const ADMIN_FADE_UP = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: "easeOut" as const },
};

export const ADMIN_DRAWER = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.18 },
  },
  panel: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
    transition: { type: "spring" as const, stiffness: 340, damping: 36 },
  },
};

export const ADMIN_KPI_STAGGER = 0.02;
