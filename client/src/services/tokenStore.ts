/**
 * JWT store with localStorage persistence (so a page refresh keeps the session).
 *
 * Why localStorage: the app uses short-lived bearer JWTs with no refresh
 * endpoint — losing the token on every reload forces a login each time.
 * XSS tradeoff accepted per project decision; server still validates every
 * request. AuthContext is the only writer during normal flows;
 * services/api.ts clears with reason "expired" when the server rejects it.
 */

export type ClearReason = "logout" | "expired";

type Listener = (reason?: ClearReason) => void;

const STORAGE_KEY = "surl.token";

function readPersisted(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writePersisted(value: string | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    // Ignore — session just won't survive refresh in this environment.
  }
}

let token: string | null = readPersisted();
const listeners = new Set<Listener>();

export const tokenStore = {
  get(): string | null {
    return token;
  },

  set(next: string): void {
    token = next;
    writePersisted(next);
    listeners.forEach((l) => l());
  },

  clear(reason?: ClearReason): void {
    token = null;
    writePersisted(null);
    listeners.forEach((l) => l(reason));
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
