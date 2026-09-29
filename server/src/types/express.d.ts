declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role?: "user" | "admin" };
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};