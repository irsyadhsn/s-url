import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.js";
import * as linksController from "./links.controller.js";
import {
  createLinkSchema,
  idParamSchema,
  listLinksQuerySchema,
  updateLinkSchema,
} from "./links.schemas.js";

const router = Router();

router.use(authenticate);

router.post("/", validateBody(createLinkSchema), linksController.create);
router.get("/", validateQuery(listLinksQuerySchema), linksController.list);
router.put(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateLinkSchema),
  linksController.update,
);
router.delete(
  "/:id",
  validateParams(idParamSchema),
  linksController.remove,
);

export default router;