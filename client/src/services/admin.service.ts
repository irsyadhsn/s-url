import { api } from "./api";
import type {
  AdminLink,
  AdminOverview,
  AdminUser,
  ListAdminLinksResponse,
  ListUsersResponse,
  UserRole,
} from "./types";

export interface AdminListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * All /api/admin calls (admin-only; server enforces the admin role).
 * Token injection happens in services/api.ts.
 */
export const adminService = {
  listUsers(
    params: AdminListParams = {},
    signal?: AbortSignal,
  ): Promise<ListUsersResponse> {
    return api.get<ListUsersResponse>("/api/admin/users", {
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search || undefined,
      },
      signal,
    });
  },

  updateUserRole(id: string, role: UserRole): Promise<{ user: AdminUser }> {
    return api.patch<{ user: AdminUser }>(`/api/admin/users/${id}`, {
      body: { role },
    });
  },

  removeUser(id: string): Promise<void> {
    return api.delete<void>(`/api/admin/users/${id}`);
  },

  listLinks(
    params: AdminListParams = {},
    signal?: AbortSignal,
  ): Promise<ListAdminLinksResponse> {
    return api.get<ListAdminLinksResponse>("/api/admin/links", {
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search || undefined,
      },
      signal,
    });
  },

  removeLink(id: string): Promise<void> {
    return api.delete<void>(`/api/admin/links/${id}`);
  },

  overview(days = 14, signal?: AbortSignal): Promise<AdminOverview> {
    return api.get<AdminOverview>("/api/admin/overview", {
      query: { days },
      signal,
    });
  },
};

export type { AdminLink, AdminUser };
