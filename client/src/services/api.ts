import { API_BASE_URL } from "../config/env";
import { tokenStore } from "./tokenStore";
import type { ApiErrorBody } from "./types";

const BASE_URL = API_BASE_URL;

/**
 * Normalized error for every non-2xx response (or network failure).
 * Components catch this and surface `message` to the user — never raw console noise.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }

  static network(message = "Cannot reach the server. Is it running?"): ApiError {
    return new ApiError(0, { message, code: "NETWORK_ERROR" });
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  /** Query string params; undefined/null values are omitted. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** JSON-serializable body. Omit for GET/DELETE without payload. */
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204 || res.headers.get("Content-Length") === "0") {
    return undefined;
  }
  const contentType = res.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }
  try {
    return (await res.json()) as unknown;
  } catch {
    return undefined;
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const token = tokenStore.get();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw ApiError.network();
  }

  const data = await parseBody(res);

  if (!res.ok) {
    // Rejecting a token we actually sent → session is dead; notify store
    // subscribers (AuthContext logs the user out with an "expired" reason).
    // Login 401s never hit this branch: no token is attached yet.
    if (res.status === 401 && token) {
      tokenStore.clear("expired");
    }
    const errBody =
      data && typeof data === "object" && "error" in data
        ? (data as { error: ApiErrorBody }).error
        : undefined;
    throw new ApiError(
      res.status,
      errBody ?? { message: `Request failed (${res.status})`, code: "UNKNOWN_ERROR" },
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),
  post: <T>(path: string, options?: RequestOptions) =>
    request<T>("POST", path, options),
  put: <T>(path: string, options?: RequestOptions) =>
    request<T>("PUT", path, options),
  patch: <T>(path: string, options?: RequestOptions) =>
    request<T>("PATCH", path, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};
