import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Logo, LogoMark } from "../components/ui/Logo";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400";

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: ReactNode;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold tracking-widest text-indigo-600 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

const FEATURES: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Custom aliases",
    body: "Pick your own short codes — letters, digits, dashes and underscores — or let us generate a random one.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    ),
  },
  {
    title: "Click analytics",
    body: "Daily click charts, 7/14/30-day ranges, top-link rankings and per-link stats with peak-day KPIs.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z"
      />
    ),
  },
  {
    title: "Link expiry",
    body: "Set an expiry date per link. When time runs out the short URL stops redirecting and shows a friendly page.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
      />
    ),
  },
  {
    title: "REST API",
    body: "Everything the dashboard does is available over JSON — authenticate with a token and automate your workflow.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
      />
    ),
  },
  {
    title: "Roles & moderation",
    body: "Admins can promote users, review every link in the system, and remove abuse from a single console.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
      />
    ),
  },
  {
    title: "Fast redirects",
    body: "Redirects are cached in Redis, so clicks resolve in milliseconds while still being counted accurately.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    ),
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
    <div className="relative mx-auto max-w-5xl">
      <div
        aria-hidden="true"
        className="absolute -inset-x-6 -top-8 bottom-6 rounded-[2rem] bg-gradient-to-tr from-indigo-100 via-indigo-50 to-white blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift ring-1 ring-slate-900/5">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
          </span>
          <span className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-white px-3 py-1 text-center font-mono text-xs text-slate-500">
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
                <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  {kpi.label}
                </p>
                <p className="mt-0.5 text-lg font-semibold text-slate-900 tabular-nums">
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
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-500 to-indigo-400"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
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
              <tbody className="divide-y divide-slate-100">
                {MOCK_ROWS.map((row) => (
                  <tr key={row.code}>
                    <td className="px-3 py-2 font-medium text-indigo-700">
                      /{row.code}
                    </td>
                    <td className="hidden max-w-56 truncate px-3 py-2 text-slate-500 sm:table-cell">
                      {row.url}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 tabular-nums">
                      {row.clicks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-gradient-to-b from-indigo-100/70 via-indigo-50/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[46rem] -translate-x-1/2 rounded-full bg-indigo-300/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20 lg:pt-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
          <span className="size-1.5 animate-pulse rounded-full bg-indigo-500" />
          Short links with click analytics
        </p>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Short links,{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            tracked.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
          Create branded short URLs, manage them in one place, and see exactly
          how they perform — daily click charts, top-link rankings, and expiry
          control built in.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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

        <p className="mt-4 text-xs font-medium text-slate-500">
          Accounts take seconds to create · Full REST API included
        </p>
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
        eyebrow="Features"
        title={<>Everything you need to run short links</>}
        body="From the first shorten to system-wide moderation, the same tools power the dashboard and the API behind it."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lift"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                {f.icon}
              </svg>
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {f.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="How it works"
          title={<>Three steps from long URL to insight</>}
          body="No configuration, no plugins. Paste, share, and let the dashboard do the counting."
        />

        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <span className="grid size-9 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm">
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
          <p className="text-xs font-semibold tracking-widest text-indigo-600 uppercase">
            Analytics
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
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
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-6 py-14 text-center shadow-lift sm:px-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full bg-indigo-300/30 blur-2xl"
        />
        <LogoMark size="lg" className="mx-auto" />
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to shorten your first link?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-indigo-100 sm:text-base">
          Create an account and your dashboard, stats, and API keys are waiting
          on the other side.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {authed ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50"
              >
                Create a free account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
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
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Product
          </span>
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
