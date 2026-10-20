import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/errors.js";
import { type CodeParam } from "./redirect.schemas.js";
import * as redirectService from "./redirect.service.js";

export const redirect: RequestHandler = async (req, res) => {
  const { code } = req.validated!.params as CodeParam;
  let outcome;
  try {
    outcome = await redirectService.resolve(code, req.ip ?? "unknown");
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      res.set("Retry-After", String(env.REDIRECT_RATE_WINDOW_S));
    }
    throw err;
  }

  switch (outcome.kind) {
    case "link": {
      await redirectService.recordClick(code);
      res.redirect(302, outcome.originalUrl);
      return;
    }
    case "expired": {
      if (env.FRONTEND_URL) {
        res.redirect(
          302,
          `${env.FRONTEND_URL}/expired?code=${encodeURIComponent(code)}`,
        );
        return;
      }
      throw new ApiError(410, "LINK_EXPIRED", "This link has expired");
    }
    case "missing":
      throw ApiError.notFound("Short link not found");
  }
};
