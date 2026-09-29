import type { RequestHandler } from "express";
import { ApiError } from "../../utils/errors.js";
import type { CheckoutBody } from "./billing.schemas.js";
import * as billingService from "./billing.service.js";
import * as billingRepo from "./billing.repository.js";

/** Plans are static — safe to serve anonymously on the pricing page. */
export const plans: RequestHandler = (_req, res) => {
  res.json({ plans: billingService.listPlans() });
};

export const subscription: RequestHandler = async (req, res) => {
  const user = await billingRepo.findUserById(req.user!.id);
  if (!user) {
    throw ApiError.unauthorized("Account no longer exists");
  }
  res.json({ subscription: await billingService.getSubscription(user) });
};

export const checkout: RequestHandler = async (req, res) => {
  const user = await billingRepo.findUserById(req.user!.id);
  if (!user) {
    throw ApiError.unauthorized("Account no longer exists");
  }
  const result = await billingService.checkout(
    user,
    req.validated!.body as CheckoutBody,
  );
  res.status(201).json(result);
};

export const payments: RequestHandler = async (req, res) => {
  const items = await billingService.listPayments(req.user!.id);
  res.json({ items });
};
