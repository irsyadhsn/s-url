import { useCallback, useEffect, useState } from "react";
import { linksService } from "../services/links.service";
import type { ListLinksResponse } from "../services/types";

export type LinksStatus = "loading" | "success" | "error";

interface FetchState {
  /** Identifies which page/version the result belongs to. */
  key: string;
  status: "success" | "error";
  data: ListLinksResponse | null;
  error: string | null;
}

interface UseLinksResult {
  status: LinksStatus;
  data: ListLinksResponse | null;
  error: string | null;
  /** Re-fetch the current page (after create/update/delete). */
  reload(): void;
}

const POLL_MS = 3000;

/**
 * Paginated link list with explicit loading/error status.
 * Aborts in-flight requests on page change or unmount.
 * `loading` is derived (state key mismatch) — no sync setState in effects.
 *
 * Also silently polls every 3s (and on tab focus/visibility) so click
 * counts stay fresh without flashing the loading skeleton.
 */
export function useLinks(page: number, pageSize = 20): UseLinksResult {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<FetchState | null>(null);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const key = `${page}:${pageSize}:${version}`;

  // Initial / page-change / version-change fetch (shows loading state).
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    linksService
      .list({ page, pageSize }, controller.signal)
      .then((res) => {
        if (cancelled) return;
        setState({ key, status: "success", data: res, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "Failed to load links";
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
  }, [key, page, pageSize]);

  // Background refresh: same key → status stays "success", no skeleton flash.
  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;

    const silentRefresh = () => {
      if (document.visibilityState === "hidden") return;
      controller?.abort();
      controller = new AbortController();
      linksService
        .list({ page, pageSize }, controller.signal)
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
  }, [key, page, pageSize]);

  const isCurrent = state?.key === key;
  return {
    status: isCurrent ? state!.status : "loading",
    data: state?.data ?? null,
    error: isCurrent ? state!.error : null,
    reload,
  };
}
