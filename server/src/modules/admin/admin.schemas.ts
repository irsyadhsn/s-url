import { z } from "zod";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
});

export const listLinksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(2048).optional(),
});

export const updateUserRoleSchema = z
  .object({
    role: z.enum(["user", "admin"]),
  })
  .strict();

export const idParamSchema = z.object({
  id: z.uuid("Invalid id"),
});

export const overviewQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ListLinksQuery = z.infer<typeof listLinksQuerySchema>;
export type UpdateUserRoleBody = z.infer<typeof updateUserRoleSchema>;
export type OverviewQuery = z.infer<typeof overviewQuerySchema>;
