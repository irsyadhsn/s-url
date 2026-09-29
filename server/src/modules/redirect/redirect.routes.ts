import { Router } from "express";
import { validateParams } from "../../middleware/validate.js";
import * as redirectController from "./redirect.controller.js";
import { codeParamSchema } from "./redirect.schemas.js";

const router = Router();

router.get(
  "/:code",
  validateParams(codeParamSchema),
  redirectController.redirect,
);

export default router;