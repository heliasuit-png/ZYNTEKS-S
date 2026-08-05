import "server-only";

import { unstable_cache } from "next/cache";

import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { createSupabaseAdminClient } from "@/supabase/admin";

export interface PlatformRuntimeSettings {
  platformName: string;
  maintenanceEnabled: boolean;
  maintenanceMessage: string | null;
  registrationEnabled: boolean;
  passwordMinLength: number;
  sessionTimeoutHours: number;
  mfaRequired: boolean;
}

const DEFAULTS: PlatformRuntimeSettings = {
  platformName: "ZYNTEKSIS",
  maintenanceEnabled: false,
  maintenanceMessage: null,
  registrationEnabled: true,
  passwordMinLength: 8,
  sessionTimeoutHours: 720,
  mfaRequired: false,
};

async function loadPlatformRuntimeSettings(): Promise<PlatformRuntimeSettings> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("platform_settings")
      .select(
        "platform_name, maintenance_enabled, maintenance_message, registration_enabled, password_min_length, session_timeout_hours, mfa_required",
      )
      .eq("id", 1)
      .maybeSingle();
    if (error) throw mapPostgrestError(error);
    if (!data) return DEFAULTS;
    return {
      platformName: data.platform_name,
      maintenanceEnabled: data.maintenance_enabled,
      maintenanceMessage: data.maintenance_message,
      registrationEnabled: data.registration_enabled,
      passwordMinLength: data.password_min_length,
      sessionTimeoutHours: data.session_timeout_hours,
      mfaRequired: data.mfa_required,
    };
  } catch {
    // Table may not exist yet before migration; fail open to product defaults.
    return DEFAULTS;
  }
}

/** Cached platform settings for product enforcement (registration / maintenance). */
export function getPlatformRuntimeSettings(): Promise<PlatformRuntimeSettings> {
  return unstable_cache(loadPlatformRuntimeSettings, ["platform-runtime-settings"], {
    revalidate: 30,
    tags: ["platform-runtime-settings"],
  })();
}
