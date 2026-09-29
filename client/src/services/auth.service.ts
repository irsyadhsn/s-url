import { api } from "./api";
import type { LoginResponse, PublicUser, RegisterResponse } from "./types";

/**
 * POST /api/auth/register — returns { user } only (no token).
 * Caller must follow up with login().
 *
 * POST /api/auth/login — returns { token, user }.
 * GET  /api/auth/me    — returns { user }; requires Bearer token.
 */
export const authService = {
  register(body: { email: string; password: string }): Promise<RegisterResponse> {
    return api.post<RegisterResponse>("/api/auth/register", { body });
  },

  login(body: { email: string; password: string }): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/auth/login", { body });
  },

  me(signal?: AbortSignal): Promise<{ user: PublicUser }> {
    return api.get<{ user: PublicUser }>("/api/auth/me", { signal });
  },
};
