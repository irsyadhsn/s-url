import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/errors.js";
import { codeParamSchema, type CodeParam } from "./redirect.schemas.js";
import * as redirectService from "./redirect.service.js";

export const redirect: RequestHandler = async (req, res) => {
  const { code } = req.validated!.params as CodeParam;
  const outcome = await redirectService.resolve(code);

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
