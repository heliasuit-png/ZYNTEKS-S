/**
 * Lemon Squeezy REST helpers (checkout + portal).
 * Never logs API keys or webhook secrets.
 */

import type { LemonSqueezyConfig } from "@/services/billing/lemon-squeezy/config";
import type { CheckoutInput, PortalInput } from "@/services/billing/types";

export interface LemonCheckoutCreateResult {
  ok: boolean;
  checkoutUrl: string | null;
  message: string;
}

export async function createLemonCheckout(opts: {
  config: LemonSqueezyConfig;
  variantId: string;
  input: CheckoutInput;
  fetchImpl?: typeof fetch;
}): Promise<LemonCheckoutCreateResult> {
  const fetchFn = opts.fetchImpl ?? fetch;
  const body = {
    data: {
      type: "checkouts",
      attributes: {
        // TEST MODE only unless live is explicitly allowed.
        test_mode: opts.config.mode !== "live",
        checkout_data: {
          email: opts.input.email,
          custom: {
            // Server-authenticated ids only — never trust client arbitrary user_id.
            user_id: opts.input.userId,
            workspace_id: opts.input.workspaceId,
          },
        },
        product_options: {
          redirect_url: opts.input.successUrl,
        },
        checkout_options: {
          embed: false,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: opts.config.storeId },
        },
        variant: {
          data: { type: "variants", id: opts.variantId },
        },
      },
    },
  };

  const res = await fetchFn(`${opts.config.apiBaseUrl}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${opts.config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return {
      ok: false,
      checkoutUrl: null,
      message: `Lemon Squeezy checkout failed (HTTP ${res.status}).`,
    };
  }

  const json = (await res.json().catch(() => null)) as {
    data?: { attributes?: { url?: string } };
  } | null;
  const url = json?.data?.attributes?.url ?? null;
  if (!url) {
    return {
      ok: false,
      checkoutUrl: null,
      message: "Lemon Squeezy checkout response missing URL.",
    };
  }
  return { ok: true, checkoutUrl: url, message: "Checkout session created." };
}

/**
 * Resolve customer portal URL from Lemon Squeezy subscription attributes.
 * Does not invent static/fake portal URLs.
 */
export async function fetchLemonCustomerPortalUrl(opts: {
  config: LemonSqueezyConfig;
  subscriptionId: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: boolean; url: string | null; message: string }> {
  const fetchFn = opts.fetchImpl ?? fetch;
  const res = await fetchFn(
    `${opts.config.apiBaseUrl}/subscriptions/${opts.subscriptionId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${opts.config.apiKey}`,
      },
    },
  );

  if (!res.ok) {
    return {
      ok: false,
      url: null,
      message: `Lemon Squeezy subscription lookup failed (HTTP ${res.status}).`,
    };
  }

  const json = (await res.json().catch(() => null)) as {
    data?: {
      attributes?: { urls?: { customer_portal?: string } };
    };
  } | null;
  const url = json?.data?.attributes?.urls?.customer_portal ?? null;
  if (!url) {
    return {
      ok: false,
      url: null,
      message: "Customer portal URL not returned by Lemon Squeezy.",
    };
  }
  return { ok: true, url, message: "Portal URL resolved." };
}

/** Build portal session from PortalInput when we only have customer id — unsupported without subscription id. */
export function portalRequiresSubscriptionId(input: PortalInput): boolean {
  return !input.providerCustomerId;
}
