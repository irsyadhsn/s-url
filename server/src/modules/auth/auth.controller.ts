import type { RequestHandler } from "express";
import type { LoginBody, RegisterBody } from "./auth.schemas.js";
import * as authService from "./auth.service.js";

export const register: RequestHandler = async (req, res) => {
  const user = await authService.register(req.validated!.body as RegisterBody);
  res.status(201).json({ user });
};

export const login: RequestHandler = async (req, res) => {
  const result = await authService.login(req.validated!.body as LoginBody);
  res.json(result);
};

export const me: RequestHandler = async (req, res) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.json({ user });
};