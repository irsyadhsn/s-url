import { randomBytes } from "node:crypto";
import { ApiError } from "../../utils/errors.js";
import type { CheckoutBody } from "./billing.schemas.js";
import * as billingRepo from "./billing.repository.js";
import {
  PLAN_CATALOG,
  PREMIUM_CURRENCY,
  PREMIUM_DURATION_MS,
  PREMIUM_PRICE_CENTS,
  effectivePlan,
  planExpiryOrNull,
} from "./plan.js";
import type { Payment, User } from "../../db/schema.js";

function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export interface PaymentView {
  id: string;
  reference: string;
  plan: Payment["plan"];
  amountCents: number;
  amount: string;
  currency: string;
  status: Payment["status"];
  planExpiresAt: string | null;
  createdAt: string;
}

function toPaymentView(payment: Payment): PaymentView {
  return {
    id: payment.id,
    reference: payment.reference,
    plan: payment.plan,
    amountCents: payment.amountCents,
    amount: formatMoney(payment.amountCents, payment.currency),
    currency: payment.currency,
    status: payment.status,
    planExpiresAt: payment.planExpiresAt
      ? payment.planExpiresAt.toISOString()
      : null,
    createdAt: payment.createdAt.toISOString(),
  };
}

export interface SubscriptionView {
  plan: "free" | "premium";
  planExpiresAt: string | null;
  daysRemaining: number | null;
  customAliasUsed: number;
  customAliasLimit: number | null;
}

function daysLeft(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export async function getSubscription(user: User): Promise<SubscriptionView> {
  const plan = effectivePlan(user);
  const info = PLAN_CATALOG.find((p) => p.id === plan)!;
  const customAliasUsed = await billingRepo.countCustomAliases(user.id);

  return {
    plan,
    planExpiresAt: planExpiryOrNull(user),
    daysRemaining: plan === "premium" ? daysLeft(user.planExpiresAt) : null,
    customAliasUsed,
    customAliasLimit: user.role === "admin" ? null : info.customAliasLimit,
  };
}

export function listPlans() {
  return PLAN_CATALOG;
}

export async function checkout(user: User, input: CheckoutBody) {
  if (input.plan !== "premium") {
    throw ApiError.badRequest("Unsupported plan", "UNSUPPORTED_PLAN");
  }

  const now = Date.now();
  const stillPremium = effectivePlan(user) === "premium";
  const currentExpiry = stillPremium ? user.planExpiresAt!.getTime() : now;
  const base = Math.max(now, currentExpiry);
  const planExpiresAt = new Date(base + PREMIUM_DURATION_MS);

  const reference = `SV-${randomBytes(4).toString("hex").toUpperCase()}`;

  const { payment } = await billingRepo.purchasePremium(user.id, {
    reference,
    amountCents: PREMIUM_PRICE_CENTS,
    currency: PREMIUM_CURRENCY,
    planExpiresAt,
  });

  return {
    receipt: toPaymentView(payment),
    subscription: {
      plan: "premium" as const,
      planExpiresAt: planExpiresAt.toISOString(),
      daysRemaining: daysLeft(planExpiresAt),
      customAliasUsed: await billingRepo.countCustomAliases(user.id),
      customAliasLimit: null,
    },
  };
}

export async function listPayments(userId: string): Promise<PaymentView[]> {
  const rows = await billingRepo.listPayments(userId);
  return rows.map(toPaymentView);
}
