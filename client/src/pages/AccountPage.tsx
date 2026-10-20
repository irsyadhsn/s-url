import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import { billingService } from "../services/billing.service";
import type { PaymentRecord, SubscriptionInfo } from "../services/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PlanBadge({ plan }: { plan: SubscriptionInfo["plan"] }) {
  return plan === "premium" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
      <svg
        className="size-3.5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M11.48 3.5a.6.6 0 0 1 1.04 0l2.3 4.06 4.53.56a.6.6 0 0 1 .34 1.02l-3.35 3.08.9 4.5a.6.6 0 0 1-.87.64L12 15.35l-4.07 2.01a.6.6 0 0 1-.87-.64l.9-4.5-3.35-3.08a.6.6 0 0 1 .34-1.02l4.53-.56 2.3-4.06Z" />
      </svg>
      Premium
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
      Free
    </span>
  );
}

function RoleBadge({ role }: { role: "user" | "admin" }) {
  return role === "admin" ? (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
      admin
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
      user
    </span>
  );
}

function UsageBar({
  used,
  limit,
}: {
  used: number;
  limit: number | null;
}) {
  const pct = limit === null ? 100 : Math.min(100, (used / limit) * 100);
  const over = limit !== null && used >= limit;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-700">Custom aliases</span>
        <span className="text-slate-500">
          {limit === null ? `${used} used · unlimited` : `${used} / ${limit}`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit ?? used + 1}
        aria-label="Custom aliases used"
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full transition-all ${
            limit === null || !over ? "bg-indigo-500" : "bg-amber-500"
          }`}
          style={{ width: `${limit === null ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}

function PaymentHistory({
  items,
  showPlansCta,
}: {
  items: PaymentRecord[];
  showPlansCta: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-slate-700">No payments yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Simulated receipts will appear here after you upgrade.
        </p>
        {showPlansCta ? (
          <Link to="/pricing" className="mt-4 inline-block">
            <Button variant="secondary">View plans</Button>
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
            <th className="px-5 py-3 font-semibold">Reference</th>
            <th className="px-5 py-3 font-semibold">Date</th>
            <th className="px-5 py-3 font-semibold">Plan</th>
            <th className="px-5 py-3 font-semibold">Amount</th>
            <th className="px-5 py-3 font-semibold">Active until</th>
            <th className="px-5 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.id}
              className="border-b border-slate-200 transition-colors last:border-0 hover:bg-slate-50"
            >
              <td className="px-5 py-3 font-mono text-xs font-medium text-indigo-600">
                {p.reference}
              </td>
              <td className="px-5 py-3 text-slate-600">
                {formatDate(p.createdAt)}
              </td>
              <td className="px-5 py-3 text-slate-600 capitalize">{p.plan}</td>
              <td className="px-5 py-3 font-medium text-slate-900">
                {p.amount}
              </td>
              <td className="px-5 py-3 text-slate-600">
                {formatDate(p.planExpiresAt)}
              </td>
              <td className="px-5 py-3">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-700">
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AccountPage() {
  const { user, refreshUser, logout } = useAuth();

  interface BillingState {
    /** Identifies which version of the data this is (retry bumps it). */
    key: number;
    subscription: SubscriptionInfo | null;
    payments: PaymentRecord[] | null;
    error: string | null;
  }

  const [version, setVersion] = useState(0);
  const [state, setState] = useState<BillingState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const key = version;

    Promise.all([
      billingService.subscription(controller.signal),
      billingService.payments(controller.signal),
    ])
      .then(([sub, pay]) => {
        if (cancelled) return;
        setState({
          key,
          subscription: sub.subscription,
          payments: pay.items,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState((prev) => ({
          key,
          subscription: prev?.subscription ?? null,
          payments: prev?.payments ?? null,
          error: "Could not load your subscription. Please try again.",
        }));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [version]);

  // Plan shown in the navbar may be a render behind right after checkout.
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const isCurrent = state?.key === version;
  const subscription = isCurrent ? state!.subscription : null;
  const payments = isCurrent ? state!.payments : null;
  const error = isCurrent ? state!.error : null;
  /** No usable payload yet — first load or a retry in flight. */
  const initialLoad = subscription === null && error === null;

  const plan = subscription?.plan ?? user?.plan ?? "free";
  const isPremium = plan === "premium";
  /** Admins bypass billing — no pricing, no upgrade buttons anywhere. */
  const isAdmin = user?.role === "admin";

  function retry() {
    setVersion((v) => v + 1);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your account, subscription plan and payment history.
        </p>
      </div>

      {user ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-full bg-indigo-600 text-xl font-semibold text-white"
                aria-hidden="true"
              >
                {user.email.charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-slate-900">
                    {user.email}
                  </p>
                  <RoleBadge role={user.role} />
                  <PlanBadge plan={plan} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Member since {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <Banner message={error} onRetry={retry} retryLabel="Retry" />
      ) : null}

      {initialLoad ? (
        <div className="flex justify-center py-10">
          <Spinner label="Loading subscription" />
        </div>
      ) : subscription ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {isPremium ? "Premium plan" : "Free plan"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isPremium ? (
                    <>
                      Renews{" "}
                      <span className="font-medium text-slate-700">
                        {formatDate(subscription.planExpiresAt)}
                      </span>
                      {subscription.daysRemaining !== null ? (
                        <>
                          {" "}
                          · <strong>{subscription.daysRemaining}</strong> days
                          left
                        </>
                      ) : null}
                    </>
                  ) : subscription.customAliasLimit === null ? (
                    <>Admin accounts hold unlimited custom aliases.</>
                  ) : (
                    <>
                      {subscription.customAliasLimit} custom aliases at a time,
                      unlimited generated links.
                    </>
                  )}
                </p>
              </div>

              {!isAdmin ? (
                <div className="flex flex-col gap-2">
                  <Link to="/pricing">
                    <Button variant="secondary">
                      {isPremium ? "Renew / view plans" : "Compare plans"}
                    </Button>
                  </Link>
                  {!isPremium ? (
                    <Link to="/checkout">
                      <Button>Upgrade to Premium</Button>
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <UsageBar
                used={subscription.customAliasUsed}
                limit={subscription.customAliasLimit}
              />
              {isPremium ? (
                <p className="mt-2 text-xs text-slate-500">
                  Premium includes unlimited custom aliases.
                </p>
              ) : isAdmin ? (
                <p className="mt-2 text-xs text-slate-500">
                  Admin accounts have no alias quota.
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Delete an alias to free up a slot, or{" "}
                  <Link
                    to="/pricing"
                    className="font-medium text-indigo-600 underline-offset-2 hover:underline"
                  >
                    upgrade
                  </Link>{" "}
                  for unlimited.
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Payment history
            </h2>
            {payments === null ? (
              <div className="flex justify-center py-6">
                <Spinner label="Loading payments" />
              </div>
            ) : (
              <PaymentHistory
                items={payments}
                showPlansCta={!isAdmin}
              />
            )}
            <p className="mt-3 text-xs text-slate-500">
              All payments are simulated — no payment gateway is involved and
              no money changes hands.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
