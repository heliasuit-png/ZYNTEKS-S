"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` once the component has mounted on the client. Useful for
 * guarding against hydration mismatches when rendering client-only UI.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
