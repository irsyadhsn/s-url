import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.js";
import * as adminController from "./admin.controller.js";
import {
  idParamSchema,
  listLinksQuerySchema,
  listUsersQuerySchema,
  overviewQuerySchema,
  updateUserRoleSchema,
} from "./admin.schemas.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/users", validateQuery(listUsersQuerySchema), adminController.listUsers);
router.patch(
  "/users/:id",
  validateParams(idParamSchema),
  validateBody(updateUserRoleSchema),
  adminController.updateUserRole,
);
router.delete(
  "/users/:id",
  validateParams(idParamSchema),
  adminController.removeUser,
);

router.get("/links", validateQuery(listLinksQuerySchema), adminController.listLinks);
router.delete(
  "/links/:id",
  validateParams(idParamSchema),
  adminController.removeLink,
);

router.get("/overview", validateQuery(overviewQuerySchema), adminController.overview);

export default router;
