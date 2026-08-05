import type { ReactNode } from "react";

import "@/features/admin/admin-theme.css";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div data-admin-theme>{children}</div>;
}
