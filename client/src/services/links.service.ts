import { api } from "./api";
import type { Link, ListLinksResponse } from "./types";

export interface CreateLinkInput {
  originalUrl: string;
  customAlias?: string;
  expiresAt?: string;
}

export interface UpdateLinkInput {
  originalUrl?: string;
  expiresAt?: string | null;
}

/**
 * All /api/links calls. Token injection happens in services/api.ts.
 */
export const linksService = {
  list(
    params: { page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
  ): Promise<ListLinksResponse> {
    return api.get<ListLinksResponse>("/api/links", {
      query: { page: params.page ?? 1, pageSize: params.pageSize ?? 20 },
      signal,
    });
  },

  create(body: CreateLinkInput): Promise<{ link: Link }> {
    return api.post<{ link: Link }>("/api/links", { body });
  },

  update(id: string, body: UpdateLinkInput): Promise<{ link: Link }> {
    return api.put<{ link: Link }>(`/api/links/${id}`, { body });
  },

  remove(id: string): Promise<void> {
    return api.delete<void>(`/api/links/${id}`);
  },
};
