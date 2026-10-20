import { Router } from "express";
import { redirectLimiter } from "../../middleware/rateLimit.js";
import { validateParams } from "../../middleware/validate.js";
import * as redirectController from "./redirect.controller.js";
import { codeParamSchema } from "./redirect.schemas.js";

const router = Router();

router.get(
  "/:code",
  validateParams(codeParamSchema),
  redirectLimiter,
  redirectController.redirect,
);

export default router;