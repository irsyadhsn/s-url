import { useCallback, useEffect, useState } from "react";
import { shortLinkFor } from "../../config/env";
import { parseError } from "../../lib/errors";
import { adminService } from "../../services/admin.service";
import type { AdminOverview } from "../../services/types";
import { ClicksChart } from "../stats/ClicksChart";
import { StatCard, StatCardSkeleton } from "../stats/StatCard";
import { Banner } from "../ui/Banner";

const RANGES = [7, 14, 30] as const;

type FetchStatus = "loading" | "success" | "error";

interface OverviewPanelProps {
  /** Bump after user/link changes so totals refetch. */
  refreshToken: number;
}

export function OverviewPanel({ refreshToken }: OverviewPanelProps) {
  const [days, setDays] = useState<number>(14);
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminOverview | null>(null);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const key = `${days}:${refreshToken}:${version}`;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    adminService
      .overview(days, controller.signal)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setStatus("success");
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
        setError(parseError(err).message ?? "Failed to load system stats");
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [days, key]);

  const loading = status === "loading" && !data;
  const totals = data?.totals;

  return (
    <section aria-label="System overview" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loading || !totals ? (
          Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Users"
              value={totals.users}
              hint={`${totals.admins} admin${totals.admins === 1 ? "" : "s"}`}
            />
            <StatCard label="New users (7d)" value={totals.newUsers} />
            <StatCard
              label="Links"
              value={totals.links}
              hint={`${totals.activeLinks} active`}
            />
            <StatCard
              label="Total clicks"
              value={totals.clicks}
              hint={`${totals.clicksToday} today`}
            />
          </>
        )}
      </div>

      {status === "error" && !data ? (
        <Banner
          message={error ?? "Failed to load stats"}
          onRetry={reload}
          retryLabel="Retry"
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Clicks (all users)
              </h2>
              <div
                role="group"
                aria-label="Chart range"
                className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
              >
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDays(r)}
                    aria-pressed={days === r}
                    className={[
                      "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      days === r
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    ].join(" ")}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            </div>
            {loading || !data ? (
              <div
                aria-busy="true"
                className="h-46 animate-pulse rounded-xl bg-slate-100"
              />
            ) : (
              <ClicksChart
                series={data.series}
                caption={`Last ${days} days · UTC`}
              />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold text-slate-900">Top links</h2>
            <ol className="mt-2 flex flex-col divide-y divide-slate-200">
              {loading || !data ? (
                Array.from({ length: 4 }, (_, i) => (
                  <li key={i} className="py-2.5">
                    <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  </li>
                ))
              ) : data.topLinks.length === 0 ? (
                <li className="py-4 text-center text-sm text-slate-400">
                  No links yet
                </li>
              ) : (
                data.topLinks.map((link, i) => (
                  <li key={link.id}>
                    <a
                      href={shortLinkFor(link.shortCode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-2 rounded-lg px-1 py-2.5 text-left transition-colors hover:bg-indigo-50/70"
                      title={`Open /${link.shortCode}`}
                    >
                      <span className="grid size-4 shrink-0 place-items-center rounded bg-slate-100 text-[10px] font-semibold text-slate-500 tabular-nums">
                        {i + 1}
                      </span>
                      <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-700">
                        /{link.shortCode}
                      </code>
                      <span className="text-xs font-semibold text-indigo-600 tabular-nums">
                        {link.clicks.toLocaleString()}
                      </span>
                    </a>
                  </li>
                ))
              )}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
