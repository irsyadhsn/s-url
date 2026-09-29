import { createContext } from "react";
import type { PublicUser } from "../services/types";

/**
 * Auth status machine:
 *   loading       — restoring a session (only if a token exists at boot)
 *   authenticated — valid token + user loaded
 *   anonymous     — no session
 *
 * Token is persisted in localStorage (tokenStore) so a page refresh
 * rehydrates the session via GET /api/auth/me instead of logging out.
 */
export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  login(email: string, password: string): Promise<PublicUser>;
  register(email: string, password: string): Promise<PublicUser>;
  logout(): void;
  /** Re-reads /api/auth/me — used after a plan change (checkout). */
  refreshUser(): Promise<PublicUser | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
