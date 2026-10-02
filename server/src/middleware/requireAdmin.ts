import type { NextFunction, Request, Response } from "express";
import * as userRepo from "../modules/auth/auth.repository.js";
import { ApiError } from "../utils/errors.js";

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    const user = await userRepo.findById(req.user.id);
    if (!user) {
      next(ApiError.unauthorized("Account no longer exists"));
      return;
    }

    if (user.role !== "admin") {
      next(ApiError.forbidden("Admin access required"));
      return;
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}
