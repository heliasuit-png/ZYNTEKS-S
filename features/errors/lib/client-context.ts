import type { Json } from "@/types/database";

function formatClientLabel(value: Json | null, keys: string[]): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const name = keys
    .map((k) => record[k])
    .find((v) => typeof v === "string" && v.trim()) as string | undefined;
  const version =
    typeof record.version === "string" ? record.version : undefined;
  if (name && version) return `${name} ${version}`;
  return name ?? version ?? null;
}

export function describeBrowser(value: Json | null): string | null {
  return formatClientLabel(value, ["name", "browser"]);
}

export function describeOs(value: Json | null): string | null {
  return formatClientLabel(value, ["name", "os"]);
}

export function describeDevice(value: Json | null): string | null {
  return formatClientLabel(value, ["model", "name", "type", "vendor"]);
}

export function describeScreen(value: Json | null): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const w = record.width ?? record.w;
  const h = record.height ?? record.h;
  if (typeof w === "number" && typeof h === "number") return `${w}×${h}`;
  if (typeof w === "string" && typeof h === "string") return `${w}×${h}`;
  return null;
}
