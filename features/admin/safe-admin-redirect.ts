import { ADMIN_ROUTES } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";

/**
 * Post-admin-auth redirect: same-origin relative path under `/admin`,
 * excluding the login page (avoids redirect loops).
 */
export function safeAdminNextPath(
  next: string | null | undefined,
  fallback: string = ADMIN_ROUTES.dashboard,
): string {
  const path = safeNextPath(next, fallback);
  if (!path.startsWith(ADMIN_ROUTES.root)) {
    return fallback;
  }
  if (path === ADMIN_ROUTES.login || path.startsWith(`${ADMIN_ROUTES.login}/`)) {
    return fallback;
  }
  return path;
}
