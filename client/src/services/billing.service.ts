import { api } from "./api";
import type {
  CheckoutResponse,
  PaymentRecord,
  PlanInfo,
  SubscriptionInfo,
} from "./types";

/**
 * All /api/billing calls. Card details are never sent — checkout is a
 * simulation, so the request body is just the plan being purchased.
 */
export const billingService = {
  /** Public: rendered on the pricing page for logged-out visitors. */
  plans(signal?: AbortSignal): Promise<{ plans: PlanInfo[] }> {
    return api.get<{ plans: PlanInfo[] }>("/api/billing/plans", { signal });
  },

  subscription(signal?: AbortSignal): Promise<{ subscription: SubscriptionInfo }> {
    return api.get<{ subscription: SubscriptionInfo }>(
      "/api/billing/subscription",
      { signal },
    );
  },

  checkout(plan: "premium"): Promise<CheckoutResponse> {
    return api.post<CheckoutResponse>("/api/billing/checkout", {
      body: { plan },
    });
  },

  payments(signal?: AbortSignal): Promise<{ items: PaymentRecord[] }> {
    return api.get<{ items: PaymentRecord[] }>("/api/billing/payments", {
      signal,
    });
  },
};
