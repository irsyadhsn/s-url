import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "../hooks/useToast";
import { authService } from "../services/auth.service";
import { tokenStore } from "../services/tokenStore";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>(() =>
    tokenStore.get() ? "loading" : "anonymous",
  );

  // Mirror user into a ref so the tokenStore listener can tell whether a
  // live session just died (toast) vs a boot-time restore failing (silent).
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Session restore — hydrates when a persisted token survived the reload.
  // StrictMode mounts this effect twice; the first run's abort must NOT be
  // treated as an auth failure (that would clear a valid token).
  useEffect(() => {
    if (status !== "loading") return;

    const controller = new AbortController();
    authService
      .me(controller.signal)
      .then(({ user: me }) => {
        setUser(me);
        setStatus("authenticated");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        tokenStore.clear();
        setUser(null);
        setStatus("anonymous");
      });

    return () => controller.abort();
  }, [status]);

  // api.ts clears the token with reason "expired" on any 401 that carried
  // our Bearer token — drop the session and tell the user once.
  useEffect(
    () =>
      tokenStore.subscribe((reason) => {
        if (reason !== "expired") return;
        const hadSession = userRef.current !== null;
        setUser(null);
        setStatus("anonymous");
        if (hadSession) {
          toast.error("Session expired — please log in again");
        }
      }),
    [toast],
  );

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedIn } = await authService.login({
      email,
      password,
    });
    tokenStore.set(token);
    setUser(loggedIn);
    setStatus("authenticated");
    return loggedIn;
  }, []);

  /**
   * Creates the account only — backend does NOT return a token from
   * /api/auth/register, so the caller must follow up with login().
   */
  const register = useCallback(async (email: string, password: string) => {
    const { user: created } = await authService.register({ email, password });
    return created;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear("logout");
    setUser(null);
    setStatus("anonymous");
  }, []);

  /**
   * Re-fetches the current user so plan changes (checkout) show up in the
   * navbar badge immediately instead of on the next full reload.
   */
  const refreshUser = useCallback(async () => {
    try {
      const { user: me } = await authService.me();
      setUser(me);
      setStatus("authenticated");
      return me;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout, refreshUser }),
    [status, user, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
