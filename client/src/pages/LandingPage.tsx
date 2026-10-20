import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Logo } from "../components/ui/Logo";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400";

function SectionHeading({ title, body }: { title: ReactNode; body: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-medium tracking-[-0.02em] text-slate-900 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

const FEATURES: { title: string; body: string }[] = [
  {
    title: "Custom aliases",
    body: "Pick your own short codes — letters, digits, dashes and underscores — or let us generate a random one.",
  },
  {
    title: "Click analytics",
    body: "Daily click charts, 7/14/30-day ranges, top-link rankings and per-link stats with peak-day KPIs.",
  },
  {
    title: "Link expiry",
    body: "Set an expiry date per link. When time runs out the short URL stops redirecting and shows a friendly page.",
  },
  {
    title: "REST API",
    body: "Everything the dashboard does is available over JSON — authenticate with a token and automate your workflow.",
  },
  {
    title: "Roles & moderation",
    body: "Admins can promote users, review every link in the system, and remove abuse from a single console.",
  },
  {
    title: "Fast redirects",
    body: "Redirects are cached in Redis, so clicks resolve in milliseconds while still being counted accurately.",
  },
];

const STEPS = [
  {
    title: "Paste your link",
    body: "Drop in any long URL, optionally choose a custom alias and an expiry date.",
  },
  {
    title: "Share the short link",
    body: "Copy it with one click and send it anywhere — email, chat, QR codes, social.",
  },
  {
    title: "Watch the clicks",
    body: "Open the dashboard for daily charts, per-link stats, and your best-performing links.",
  },
];

const MOCK_BARS = [34, 52, 41, 68, 46, 86, 61, 74, 57, 92, 66, 79];

/** One floating feature pill — single accent color per pill (Dub signature). */
function FeaturePill({
  label,
  dot,
}: {
  label: string;
  dot: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-900">
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

const MOCK_ROWS = [
  {
    code: "launch-week",
    url: "https://example.com/blog/launch-week-announcement",
    clicks: "4,120",
  },
  {
    code: "docs",
    url: "https://example.com/docs/getting-started",
    clicks: "1,864",
  },
  {
    code: "pricing",
    url: "https://example.com/pricing?ref=newsletter",
    clicks: "947",
  },
];

function ProductMock() {
  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <span className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-xs text-slate-500">
          s-url.app/dashboard
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Links", value: "24" },
            { label: "Total clicks", value: "18,432" },
            { label: "Clicks today", value: "312" },
            { label: "Avg / link", value: "768" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            >
              <p className="text-xs font-medium text-slate-500">
                {kpi.label}
              </p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">
              Clicks
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Last 14 days
            </span>
          </div>
          <div className="flex h-24 items-end gap-1.5">
            {MOCK_BARS.map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-indigo-500"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Short link
                </th>
                <th scope="col" className="hidden px-3 py-2 sm:table-cell">
                  Original URL
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  Clicks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {MOCK_ROWS.map((row) => (
                <tr key={row.code}>
                  <td className="px-3 py-2 font-mono font-medium text-indigo-700">
                    /{row.code}
                  </td>
                  <td className="hidden max-w-56 truncate px-3 py-2 font-mono text-slate-500 sm:table-cell">
                    {row.url}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {row.clicks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-900">
          Clicks per day
        </span>
        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
          Last 14 days
        </span>
      </div>
      <div className="flex h-40 items-end gap-1.5">
        {MOCK_BARS.map((height, i) => (
          <div
            key={i}
            className="group flex h-full flex-1 flex-col justify-end"
          >
            <div
              className="w-full rounded-t-sm bg-indigo-500 transition-colors group-hover:bg-indigo-700"
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-400">
        <span>Sep 1</span>
        <span>Sep 7</span>
        <span>Sep 14</span>
      </div>
    </div>
  );
}

function Hero({ authed }: { authed: boolean }) {
  return (
    <section className="relative overflow-hidden">
      {/* signature dotted-grid texture, fading out downward */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:16px_16px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20 lg:pt-24">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <FeaturePill label="Short links" dot="bg-[#ea580c]" />
          <FeaturePill label="Click analytics" dot="bg-[#7c3aed]" />
          <FeaturePill label="Link expiry" dot="bg-[#16a34a]" />
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] font-medium tracking-[-0.02em] text-slate-900 sm:text-5xl">
          Short links, tracked.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
          Create short URLs, manage them in one place, and see exactly how
          they perform — daily click charts, top-link rankings, and expiry
          control built in.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {authed ? (
            <Link to="/dashboard" className={`${primaryBtn} px-6 py-3`}>
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className={`${primaryBtn} px-6 py-3`}>
                Get started
              </Link>
              <Link to="/login" className={secondaryBtn}>
                Log in
              </Link>
            </>
          )}
        </div>

        {/* The redirect itself, set as the hero: long URL → 302 → slug. */}
        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-lift sm:p-6">
          <p className="font-mono text-sm break-all text-slate-400 line-through sm:text-base">
            https://example.com/blog/launch-week-announcement
          </p>
          <p className="mt-3 flex items-center gap-3 font-mono text-sm font-semibold text-indigo-600">
            302
            <span className="h-px flex-1 bg-indigo-200" aria-hidden="true" />
            redirect
          </p>
          <p className="mt-3 font-mono text-2xl font-semibold break-all text-slate-900 sm:text-4xl">
            s-url.app/launch-week
          </p>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <ProductMock />
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        title={<>Everything you need to run short links</>}
        body="From the first shorten to system-wide moderation, the same tools power the dashboard and the API behind it."
      />

      <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <dt className="text-base font-semibold text-slate-900">
              {f.title}
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {f.body}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          title={<>Three steps from long URL to insight</>}
          body="No configuration, no plugins. Paste, share, and let the dashboard do the counting."
        />

        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <span className="grid size-9 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function AnalyticsSpotlight() {
  const points = [
    "Daily bar chart with exact counts and peak-day totals",
    "Range switcher: 7, 14, or 30 days of history",
    "Top-links ranking — click any row for its own stats dialog",
    "Six KPIs per link: totals, today, average, peak, status",
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-medium tracking-[-0.02em] text-slate-900 sm:text-4xl">
            Know which links actually work
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Every click is aggregated per day, so you can spot the spike after a
            launch or the quiet link that needs a new headline.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-sm text-slate-700"
              >
                <svg
                  className="mt-0.5 size-4 shrink-0 text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <MiniChart />
      </div>
    </section>
  );
}

function CtaBand({ authed }: { authed: boolean }) {
  return (
    <section className="bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="mx-auto max-w-2xl text-3xl font-medium tracking-[-0.02em] text-slate-900 sm:text-4xl">
          Ready to shorten your first link?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Create an account and your dashboard, stats, and API keys are waiting
          on the other side.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {authed ? (
            <Link to="/dashboard" className={`${primaryBtn} px-6 py-3`}>
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className={`${primaryBtn} px-6 py-3`}>
                Create a free account
              </Link>
              <Link to="/login" className={secondaryBtn}>
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer({
  authed,
  showPricing,
}: {
  authed: boolean;
  showPricing: boolean;
}) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Short links with click analytics — aliases, expiry, and a REST API
            in one dashboard.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold text-slate-900">Product</span>
          <Link
            to="/"
            className="text-slate-600 transition-colors hover:text-slate-900"
          >
            Home
          </Link>
          {showPricing ? (
            <Link
              to="/pricing"
              className="text-slate-600 transition-colors hover:text-slate-900"
            >
              Pricing
            </Link>
          ) : null}
          {authed ? (
            <Link
              to="/dashboard"
              className="text-slate-600 transition-colors hover:text-slate-900"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="text-slate-600 transition-colors hover:text-slate-900"
              >
                Sign up
              </Link>
              <Link
                to="/login"
                className="text-slate-600 transition-colors hover:text-slate-900"
              >
                Log in
              </Link>
            </>
          )}
        </nav>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} s-url
        </p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  const { status, user } = useAuth();
  const authed = status === "authenticated";
  // Admins never buy a plan — hide every pricing entrance.
  const showPricing = user?.role !== "admin";

  return (
    <div className="bg-white">
      <Hero authed={authed} />
      <Features />
      <HowItWorks />
      <AnalyticsSpotlight />
      <CtaBand authed={authed} />
      <Footer authed={authed} showPricing={showPricing} />
    </div>
  );
}
