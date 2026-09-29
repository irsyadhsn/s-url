import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";

const BEARER_PREFIX = "Bearer ";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith(BEARER_PREFIX)) {
    next(ApiError.unauthorized("Missing Authorization header (Bearer token)"));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    next(ApiError.unauthorized("Missing bearer token"));
    return;
  }

  try {
    req.user = { id: verifyAccessToken(token) };
    next();
  } catch (err) {
    next(err);
  }
}