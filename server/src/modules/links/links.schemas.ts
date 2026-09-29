import { z } from "zod";

const url = z.url("Invalid URL").max(2048, "URL too long");

const futureIso = (label: string) =>
  z.iso
    .datetime({ offset: true })
    .transform((v) => new Date(v))
    .refine((d) => d.getTime() > Date.now(), {
      message: `${label} must be a date in the future`,
    });

export const createLinkSchema = z
  .object({
    originalUrl: url,
    customAlias: z
      .string()
      .regex(
        /^[a-zA-Z0-9_-]{3,32}$/,
        "Invalid alias (3-32 chars, letters/digits/-/_)",
      )
      .optional(),
    expiresAt: futureIso("expiresAt").optional(),
  })
  .strict();

export const updateLinkSchema = z
  .object({
    originalUrl: url.optional(),
    expiresAt: futureIso("expiresAt").nullable().optional(),
  })
  .strict()
  .refine(
    (data) => data.originalUrl !== undefined || data.expiresAt !== undefined,
    { message: "At least one of originalUrl or expiresAt must be provided" },
  );

export const listLinksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.uuid("Invalid id"),
});

export type CreateLinkBody = z.infer<typeof createLinkSchema>;
export type UpdateLinkBody = z.infer<typeof updateLinkSchema>;
export type ListLinksQuery = z.infer<typeof listLinksQuerySchema>;

