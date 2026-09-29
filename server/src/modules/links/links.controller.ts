import type { RequestHandler } from "express";
import type {
  CreateLinkBody,
  ListLinksQuery,
  UpdateLinkBody,
} from "./links.schemas.js";
import * as linksService from "./links.service.js";

export const create: RequestHandler = async (req, res) => {
  const link = await linksService.createLink(
    req.user!.id,
    req.validated!.body as CreateLinkBody,
  );
  res.status(201).json({ link });
};

export const list: RequestHandler = async (req, res) => {
  const { page, pageSize } = req.validated!.query as ListLinksQuery;
  const result = await linksService.listLinks(req.user!.id, page, pageSize);
  res.json(result);
};

export const update: RequestHandler = async (req, res) => {
  const { id } = req.validated!.params as { id: string };
  const link = await linksService.updateLink(
    req.user!.id,
    id,
    req.validated!.body as UpdateLinkBody,
  );
  res.json({ link });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = req.validated!.params as { id: string };
  await linksService.deleteLink(req.user!.id, id);
  res.status(204).send();
};