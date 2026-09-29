import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors.js";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    const body: Record<string, unknown> = {
      message: err.message,
      code: err.code,
    };
    if (err.details !== undefined) {
      body.details = err.details;
    }
    res.status(err.status).json({ error: body });
    return;
  }

  const httpLikeError = fromHttpLikeError(err);
  if (httpLikeError) {
    res.status(httpLikeError.status).json({
      error: { message: httpLikeError.message, code: httpLikeError.code },
    });
    return;
  }

  const message = err instanceof Error ? err.message : String(err);
  console.error("[error]", {
    method: req.method,
    path: req.path,
    message,
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" },
  });
}

function fromHttpLikeError(
  err: unknown,
): { status: number; message: string; code: string } | null {
  if (
    typeof err !== "object" ||
    err === null ||
    typeof (err as { status?: unknown }).status !== "number"
  ) {
    return null;
  }
  const { status, type } = err as { status: number; type?: string };
  if (status < 400 || status >= 500) {
    return null;
  }
  if (type === "entity.parse.failed") {
    return { status: 400, message: "Request body is not valid JSON", code: "INVALID_JSON" };
  }
  if (type === "entity.too.large") {
    return {
      status: 413,
      message: "Request body exceeds the allowed size",
      code: "PAYLOAD_TOO_LARGE",
    };
  }
  return null;
}