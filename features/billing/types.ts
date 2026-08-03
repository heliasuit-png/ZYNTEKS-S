import type { BillingActionResult } from "@/services/billing/types";

export interface BillingActionState {
  status: "idle" | BillingActionResult["status"];
  message?: string;
  redirectUrl?: string | null;
  providerId?: string;
}

export const initialBillingActionState: BillingActionState = {
  status: "idle",
};
