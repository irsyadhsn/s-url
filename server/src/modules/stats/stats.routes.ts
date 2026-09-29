import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateParams, validateQuery } from "../../middleware/validate.js";
import * as statsController from "./stats.controller.js";
import { idParamSchema, statsQuerySchema } from "./stats.schemas.js";

const router = Router();

router.use(authenticate);

router.get(
  "/overview",
  validateQuery(statsQuerySchema),
  statsController.overview,
);

router.get(
  "/links/:id",
  validateParams(idParamSchema),
  validateQuery(statsQuerySchema),
  statsController.linkStats,
);

export default router;
