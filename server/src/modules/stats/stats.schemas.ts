import { z } from "zod";

export const statsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
});

export const idParamSchema = z.object({
  id: z.uuid("Invalid id"),
});

export type StatsQuery = z.infer<typeof statsQuerySchema>;
