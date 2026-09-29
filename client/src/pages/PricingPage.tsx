import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import { billingService } from "../services/billing.service";
import type { PlanInfo } from "../services/types";

function priceLabel(plan: PlanInfo): string {
  if (plan.priceCents === 0) return "$0";
  const dollars = (plan.priceCents / 100).toFixed(2).replace(/\.00$/, "");
  const period = plan.durationDays ? `/${plan.durationDays} days` : "";
  return `$${dollars}${period}`;
}

function PlanCard({
  plan,
  isCurrent,
  onCta,
  ctaLabel,
}: {
  plan: PlanInfo;
  isCurrent: boolean;
  onCta: () => void;
  ctaLabel: string;
}) {
  const premium = plan.id === "premium";
  return (
    <div
      className={[
        "relative flex flex-col rounded-2xl border bg-white p-6 sm:p-8",
        premium
          ? "border-indigo-200 shadow-lift"
          : "border-slate-200 shadow-card",
      ].join(" ")}
    >
      {premium ? (
        <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
          Most popular
        </span>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
        {isCurrent ? (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            Current plan
          </span>
        ) : null}
      </div>

      <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>

      <p className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-slate-900">
          {priceLabel(plan)}
        </span>
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
            <svg
              className={`mt-0.5 size-4 shrink-0 ${premium ? "text-indigo-600" : "text-emerald-500"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8 pt-1">
        <Button
          variant={premium ? "primary" : "secondary"}
          className="w-full"
          disabled={isCurrent}
          onClick={onCta}
        >
          {isCurrent ? "Your current plan" : ctaLabel}
        </Button>
      </div>
    </div>
  );
}

export function PricingPage() {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    billingService
      .plans(controller.signal)
      .then(({ plans: data }) => setPlans(data))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Could not load plans. Please try again.");
      });
    return () => controller.abort();
  }, []);

  function startCheckout() {
    if (status === "loading") return;
    if (status === "authenticated") {
      navigate("/checkout");
    } else {
      navigate("/login", { state: { from: "/checkout" } });
    }
  }

  const currentPlan = user?.plan ?? "free";

  // Admins can't buy a plan and never see the Pricing link — a direct
  // URL hit just bounces them back to the dashboard.
  if (user?.role === "admin") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Simple pricing
        </h1>
        <p className="mt-3 text-slate-600">
          Start free with custom aliases included. Upgrade to Premium for
          unlimited branded links — one flat price, 30 days per purchase.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Demo environment: checkout is simulated, no real payment is taken.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : !plans ? (
        <div className="mt-12 flex justify-center">
          <Spinner label="Loading plans" />
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === currentPlan}
              ctaLabel={
                plan.id === "premium"
                  ? status === "authenticated"
                    ? "Upgrade to Premium"
                    : "Sign up & upgrade"
                  : "Get started"
              }
              onCta={() => {
                if (plan.id === "premium") startCheckout();
                else navigate(status === "authenticated" ? "/dashboard" : "/register");
              }}
            />
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
