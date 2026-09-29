import type { RequestHandler } from "express";
import type { StatsQuery } from "./stats.schemas.js";
import * as statsService from "./stats.service.js";

export const overview: RequestHandler = async (req, res) => {
  const { days } = req.validated!.query as StatsQuery;
  const result = await statsService.getOverview(req.user!.id, days);
  res.json(result);
};

export const linkStats: RequestHandler = async (req, res) => {
  const { id } = req.validated!.params as { id: string };
  const { days } = req.validated!.query as StatsQuery;
  const result = await statsService.getLinkStats(req.user!.id, id, days);
  res.json(result);
};
