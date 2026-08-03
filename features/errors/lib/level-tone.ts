import type { BadgeProps } from "@/components/dashboard/badge";
import type { ErrorLevel } from "@/types/dashboard";

export const ERROR_LEVEL_TONE: Record<ErrorLevel, BadgeProps["tone"]> = {
  fatal: "danger",
  error: "danger",
  warning: "warning",
  info: "primary",
  debug: "default",
};
