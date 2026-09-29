const stripTrailing = (url: string): string => url.replace(/\/+$/, "");

/** Origin of the Express API (auth, links CRUD). */
export const API_BASE_URL = stripTrailing(
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
);

/**
 * Origin used to build displayable/copyable short links (GET /:code).
 * Defaults to the API origin; override when redirects are served from
 * a different domain than the JSON API.
 */
export const SHORT_BASE_URL = stripTrailing(
  import.meta.env.VITE_SHORT_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:3000",
);

export function shortLinkFor(shortCode: string): string {
  return `${SHORT_BASE_URL}/${shortCode}`;
}
