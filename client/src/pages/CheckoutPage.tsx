import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { TextField } from "../components/ui/TextField";
import { useAuth } from "../hooks/useAuth";
import { parseError, type FieldErrors } from "../lib/errors";
import { billingService } from "../services/billing.service";
import type { CheckoutResponse } from "../services/types";

/** Minimum wall-clock for the fake "processing" state — reads as a gateway round-trip. */
const SIMULATED_DELAY_MS = 1500;
const PREMIUM_PRICE_LABEL = "$9.99";

interface CardForm {
  cardNumber: string;
  expiry: string;
  cvc: string;
  name: string;
}

const EMPTY: CardForm = { cardNumber: "", expiry: "", cvc: "", name: "" };

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Client-side-only validation. Card data never leaves the browser. */
function validate(form: CardForm): FieldErrors {
  const errors: FieldErrors = {};
  const digits = form.cardNumber.replace(/\D/g, "");
  if (digits.length !== 16) errors.cardNumber = "Enter a 16-digit card number";

  const m = /^(\d{2})\/(\d{2})$/.exec(form.expiry);
  if (!m) {
    errors.expiry = "Use MM/YY";
  } else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    const now = new Date();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    if (month < 1 || month > 12) errors.expiry = "Month must be 01–12";
    else if (endOfMonth < now) errors.expiry = "Card has expired";
  }

  if (!/^\d{3,4}$/.test(form.cvc)) errors.cvc = "3 or 4 digits";
  if (form.name.trim().length < 2) errors.name = "Name on card required";

  return errors;
}

function Receipt({ result }: { result: CheckoutResponse }) {
  const { receipt, subscription } = result;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <svg
            className="size-5"
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
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            You're Premium
          </h2>
          <p className="text-sm text-slate-500">
            Simulated payment — no charge was made.
          </p>
        </div>
      </div>

      <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100 text-sm">
        <div className="flex items-center justify-between py-3">
          <dt className="text-slate-500">Reference</dt>
          <dd className="font-mono font-medium text-slate-900">
            {receipt.reference}
          </dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-slate-500">Amount</dt>
          <dd className="font-medium text-slate-900">
            {receipt.amount} {receipt.currency}
          </dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-slate-500">Plan</dt>
          <dd className="font-medium text-slate-900">Premium</dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-slate-500">Active until</dt>
          <dd className="font-medium text-slate-900">
            {subscription.planExpiresAt
              ? new Date(subscription.planExpiresAt).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "long", day: "numeric" },
                )
              : "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-slate-500">Custom aliases</dt>
          <dd className="font-medium text-slate-900">Unlimited</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to="/account" className="flex-1">
          <Button className="w-full">View my subscription</Button>
        </Link>
        <Link to="/dashboard" className="flex-1">
          <Button variant="secondary" className="w-full">
            Back to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<CardForm>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CheckoutResponse | null>(null);

  function patch(next: Partial<CardForm>) {
    setForm((prev) => ({ ...prev, ...next }));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      for (const key of Object.keys(next)) delete copy[key];
      return copy;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processing) return;
    setFieldErrors({});
    setFormError(null);

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setProcessing(true);
    try {
      // Fire the (instant) simulated checkout alongside a fixed delay so
      // the flow feels like a gateway round-trip.
      const [receipt] = await Promise.all([
        billingService.checkout("premium"),
        new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS)),
      ]);
      setResult(receipt);
      // Pull the fresh plan into AuthContext so the navbar shows PRO now.
      void refreshUser();
    } catch (err) {
      const { fields, message } = parseError(err);
      if (Object.keys(fields).length > 0) setFieldErrors(fields);
      else setFormError(message ?? "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Receipt result={result} />
      </div>
    );
  }

  const alreadyPremium = user?.plan === "premium";

  // Admins bypass billing entirely — no checkout for them.
  if (user?.role === "admin") return <Navigate to="/account" replace />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Upgrade to Premium
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {alreadyPremium
            ? "Renewing extends your current period — you never lose days you already paid for."
            : "30 days of unlimited custom aliases."}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="mb-6 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Premium plan
            </p>
            <p className="text-xs text-slate-500">30 days · unlimited aliases</p>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {PREMIUM_PRICE_LABEL}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Banner
            variant="info"
            message="Demo checkout — this form is a simulation. Card details are validated in your browser only and never sent anywhere."
          />
          {formError ? <Banner message={formError} /> : null}

          <TextField
            label="Card number"
            name="cardNumber"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            value={form.cardNumber}
            onChange={(e) => patch({ cardNumber: formatCardNumber(e.target.value) })}
            error={fieldErrors.cardNumber}
            disabled={processing}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Expiry"
              name="expiry"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={form.expiry}
              onChange={(e) => patch({ expiry: formatExpiry(e.target.value) })}
              error={fieldErrors.expiry}
              disabled={processing}
              required
            />
            <TextField
              label="CVC"
              name="cvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={form.cvc}
              onChange={(e) =>
                patch({ cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              error={fieldErrors.cvc}
              disabled={processing}
              required
            />
          </div>
          <TextField
            label="Name on card"
            name="name"
            autoComplete="cc-name"
            placeholder="Jane Doe"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            error={fieldErrors.name}
            disabled={processing}
            required
          />

          <Button type="submit" loading={processing} className="mt-2 w-full">
            {processing ? "Processing payment…" : `Pay ${PREMIUM_PRICE_LABEL}`}
          </Button>

          {processing ? (
            <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Spinner size="sm" label="Processing payment" />
              Contacting payment provider…
            </p>
          ) : (
            <p className="text-center text-xs text-slate-500">
              No real payment — nothing is charged.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
