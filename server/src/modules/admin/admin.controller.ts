import type { RequestHandler } from "express";
import type {
  ListLinksQuery,
  ListUsersQuery,
  OverviewQuery,
  UpdateUserRoleBody,
} from "./admin.schemas.js";
import * as adminService from "./admin.service.js";

export const listUsers: RequestHandler = async (req, res) => {
  const result = await adminService.listUsers(
    req.validated!.query as ListUsersQuery,
  );
  res.json(result);
};

export const updateUserRole: RequestHandler = async (req, res) => {
  const { id } = req.validated!.params as { id: string };
  const { role } = req.validated!.body as UpdateUserRoleBody;
  const user = await adminService.updateUserRole(req.user!.id, id, role);
  res.json({ user });
};

export const removeUser: RequestHandler = async (req, res) => {
  const { id } = req.validated!.params as { id: string };
  await adminService.deleteUser(req.user!.id, id);
  res.status(204).send();
};

export const listLinks: RequestHandler = async (req, res) => {
  const result = await adminService.listLinks(
    req.validated!.query as ListLinksQuery,
  );
  res.json(result);
};

export const removeLink: RequestHandler = async (req, res) => {
  const { id } = req.validated!.params as { id: string };
  await adminService.deleteLink(id);
  res.status(204).send();
};

export const overview: RequestHandler = async (req, res) => {
  const result = await adminService.getOverview(
    req.validated!.query as OverviewQuery,
  );
  res.json(result);
};
