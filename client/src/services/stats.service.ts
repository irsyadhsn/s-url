import { api } from "./api";
import type { LinkStatsResponse, OverviewStats } from "./types";

/**
 * All /api/stats calls (overview + per-link). Token injection: services/api.ts.
 */
export const statsService = {
  overview(days: number, signal?: AbortSignal): Promise<OverviewStats> {
    return api.get<OverviewStats>("/api/stats/overview", {
      query: { days },
      signal,
    });
  },

  linkStats(id: string, days: number, signal?: AbortSignal): Promise<LinkStatsResponse> {
    return api.get<LinkStatsResponse>(`/api/stats/links/${id}`, {
      query: { days },
      signal,
    });
  },
};
