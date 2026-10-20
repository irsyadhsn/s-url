import { api } from "./api";
import type { LoginResponse, PublicUser, RegisterResponse } from "./types";

export const authService = {
  register(body: {
    email: string;
    password: string;
  }): Promise<RegisterResponse> {
    return api.post<RegisterResponse>("/api/auth/register", { body });
  },

  login(body: { email: string; password: string }): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/auth/login", { body });
  },

  me(signal?: AbortSignal): Promise<{ user: PublicUser }> {
    return api.get<{ user: PublicUser }>("/api/auth/me", { signal });
  },
};
