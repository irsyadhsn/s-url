import { useCallback, useEffect, useState } from "react";
import { statsService } from "../services/stats.service";
import type { OverviewStats } from "../services/types";

export type StatsStatus = "loading" | "success" | "error";

interface FetchState {
  key: string;
  status: "success" | "error";
  data: OverviewStats | null;
  error: string | null;
}

interface UseOverviewStatsResult {
  status: StatsStatus;
  data: OverviewStats | null;
  error: string | null;
  reload(): void;
}

const POLL_MS = 3000;

/**
 * Account overview stats (totals + daily series + top links).
 * Re-fetches when `days` or `refreshToken` changes; aborts in-flight requests.
 * `refreshToken` lets the dashboard bump after create/delete without remounting.
 *
 * Also silently polls every 3s (and on tab focus/visibility) so KPIs and
 * the chart stay fresh without flashing the loading skeleton.
 */
export function useOverviewStats(
  days: number,
  refreshToken = 0,
): UseOverviewStatsResult {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<FetchState | null>(null);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const key = `${days}:${refreshToken}:${version}`;

  // Initial / days-change / refresh fetch (shows loading state).
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    statsService
      .overview(days, controller.signal)
      .then((res) => {
        if (cancelled) return;
        setState({ key, status: "success", data: res, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "Failed to load stats";
        setState((prev) => ({
          key,
          status: "error",
          data: prev?.data ?? null,
          error: message,
        }));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [key, days]);

  // Background refresh: same key → status stays "success", no skeleton flash.
  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;

    const silentRefresh = () => {
      if (document.visibilityState === "hidden") return;
      controller?.abort();
      controller = new AbortController();
      statsService
        .overview(days, controller.signal)
        .then((res) => {
          if (cancelled) return;
          setState((prev) =>
            prev && prev.key === key
              ? { ...prev, status: "success", data: res, error: null }
              : { key, status: "success", data: res, error: null },
          );
        })
        .catch(() => {
          // Background failures are non-fatal — keep last known data.
        });
    };

    const interval = setInterval(silentRefresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") silentRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      controller?.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [key, days]);

  const isCurrent = state?.key === key;
  return {
    status: isCurrent ? state!.status : "loading",
    data: state?.data ?? null,
    error: isCurrent ? state!.error : null,
    reload,
  };
}
