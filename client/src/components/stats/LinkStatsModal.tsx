import { useEffect, useState } from "react";
import { formatDateTime } from "../../lib/datetime";
import { statsService } from "../../services/stats.service";
import type { Link, LinkStatsResponse } from "../../services/types";
import { Banner } from "../ui/Banner";
import { Modal } from "../ui/Modal";
import { ClicksChart } from "./ClicksChart";
import { StatCard, StatCardSkeleton } from "./StatCard";

interface LinkStatsModalProps {
  link: Link;
  onClose(): void;
}

interface FetchState {
  /** link.id the result belongs to — stale keys render as loading. */
  key: string;
  status: "success" | "error";
  data: LinkStatsResponse | null;
  error: string | null;
}

/**
 * Per-link stats dialog: KPI grid (total/today/range/avg/peak/days),
 * 14-day chart, and link meta. Fetches on mount; Escape/backdrop close
 * comes from the shared Modal shell.
 */
export function LinkStatsModal({ link, onClose }: LinkStatsModalProps) {
  const [state, setState] = useState<FetchState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const key = link.id;

    statsService
      .linkStats(key, 14, controller.signal)
      .then((data) => {
        if (!cancelled) setState({ key, status: "success", data, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState((prev) => ({
          key,
          status: "error",
          data: prev?.data ?? null,
          error: err instanceof Error ? err.message : "Failed to load stats",
        }));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [link.id]);

  const current = state?.key === link.id ? state : null;

  return (
    <Modal open onClose={onClose} title={`Stats — /${link.shortCode}`}>
      {!current ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : current.status === "error" && !current.data ? (
        <Banner message={current.error ?? "Failed to load stats"} />
      ) : current.data ? (
        <LinkStatsContent data={current.data} />
      ) : null}
    </Modal>
  );
}

function LinkStatsContent({ data }: { data: LinkStatsResponse }) {
  const { link, stats, series } = data;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total clicks" value={stats.totalClicks} />
        <StatCard label="Today" value={stats.clicksToday} />
        <StatCard label="Last 14 days" value={stats.clicksInRange} />
        <StatCard
          label="Avg / day"
          value={stats.avgPerDay}
          hint={`${stats.daysActive}d active`}
        />
        <StatCard label="Peak day" value={stats.peakDayClicks} />
        <StatCard
          label="Status"
          value={
            link.expiresAt && new Date(link.expiresAt) < new Date()
              ? "Expired"
              : "Active"
          }
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <ClicksChart series={series} height={110} caption="Last 14 days · UTC" />
      </div>

      <dl className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="font-medium text-slate-400">Short link</dt>
          <dd
            className="truncate font-mono text-slate-700"
            title={link.shortUrl ?? `/${link.shortCode}`}
          >
            {link.shortUrl ?? `/${link.shortCode}`}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="font-medium text-slate-400">Destination</dt>
          <dd className="truncate text-slate-700" title={link.originalUrl}>
            {link.originalUrl}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-400">Created</dt>
          <dd className="text-slate-700">{formatDateTime(link.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-400">Expires</dt>
          <dd className="text-slate-700">
            {link.expiresAt ? formatDateTime(link.expiresAt) : "Never"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
