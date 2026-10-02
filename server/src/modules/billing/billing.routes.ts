import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import * as billingController from "./billing.controller.js";
import { checkoutSchema } from "./billing.schemas.js";

const router = Router();

router.get("/plans", billingController.plans);

router.use(authenticate);

router.get("/subscription", billingController.subscription);
router.post(
  "/checkout",
  validateBody(checkoutSchema),
  billingController.checkout,
);
router.get("/payments", billingController.payments);

export default router;
