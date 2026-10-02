import type { UserPlan } from "../../db/schema.js";

export const FREE_CUSTOM_ALIAS_LIMIT = 5;

export const PREMIUM_PRICE_CENTS = 999;
export const PREMIUM_CURRENCY = "USD";
export const PREMIUM_DAYS = 30;

export const PREMIUM_DURATION_MS = PREMIUM_DAYS * 24 * 60 * 60 * 1000;

interface PlanUser {
  plan: UserPlan;
  planExpiresAt: Date | null;
}

export function effectivePlan(user: PlanUser): UserPlan {
  if (user.plan !== "premium") return "free";
  if (!user.planExpiresAt) return "free";
  return user.planExpiresAt.getTime() > Date.now() ? "premium" : "free";
}

export function planExpiryOrNull(user: PlanUser): string | null {
  return user.planExpiresAt ? user.planExpiresAt.toISOString() : null;
}

export interface PlanInfo {
  id: UserPlan;
  name: string;
  priceCents: number;
  currency: string;
  customAliasLimit: number | null;
  durationDays: number | null;
  tagline: string;
  features: string[];
}

export const PLAN_CATALOG: readonly PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    priceCents: 0,
    currency: "USD",
    customAliasLimit: FREE_CUSTOM_ALIAS_LIMIT,
    durationDays: null,
    tagline: "Everything you need to start shortening.",
    features: [
      `${FREE_CUSTOM_ALIAS_LIMIT} custom aliases at a time`,
      "Unlimited generated short links",
      "Click analytics with 14-day history",
      "Link expiry dates",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    priceCents: PREMIUM_PRICE_CENTS,
    currency: PREMIUM_CURRENCY,
    customAliasLimit: null,
    durationDays: PREMIUM_DAYS,
    tagline: "Unlimited branded links for serious work.",
    features: [
      "Unlimited custom aliases",
      `${PREMIUM_DAYS}-day subscription per purchase`,
      "Premium badge on your account",
      "Everything in Free",
    ],
  },
];

export function planInfo(plan: UserPlan): PlanInfo {
  return PLAN_CATALOG.find((p) => p.id === plan) ?? PLAN_CATALOG[0]!;
}
