import { z } from "zod";

const url = z.url("Invalid URL").max(2048, "URL too long");

const ALIAS_MESSAGE = "Invalid alias (3–32 chars: letters, digits, - or _)";

const futureIso = (message: string) =>
  z
    .iso.datetime({ offset: true })
    .refine((v) => new Date(v).getTime() > Date.now(), { message });

/**
 * Payload schemas — mirror server/src/modules/links/links.schemas.ts.
 * Form values are converted to payloads first, then validated here so
 * client and server reject the same data for the same reasons.
 */
export const createLinkPayloadSchema = z
  .object({
    originalUrl: url,
    customAlias: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{3,32}$/, ALIAS_MESSAGE)
      .optional(),
    expiresAt: futureIso("Expiry must be a date in the future").optional(),
  })
  .strict();

export const updateLinkPayloadSchema = z
  .object({
    originalUrl: url.optional(),
    expiresAt: futureIso("Expiry must be a date in the future")
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) => data.originalUrl !== undefined || data.expiresAt !== undefined,
    { message: "Nothing to update" },
  );

export type CreateLinkPayload = z.infer<typeof createLinkPayloadSchema>;
export type UpdateLinkPayload = z.infer<typeof updateLinkPayloadSchema>;

/** Raw controlled-form state (datetime-local + optional text inputs). */
export interface LinkFormValues {
  originalUrl: string;
  customAlias: string;
  /** datetime-local value or "" for none. */
  expiresAt: string;
}

export function emptyLinkForm(): LinkFormValues {
  return { originalUrl: "", customAlias: "", expiresAt: "" };
}

function buildExpiresAt(expiresAtLocal: string): string | undefined {
  if (!expiresAtLocal) return undefined;
  const date = new Date(expiresAtLocal);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function toCreatePayload(
  values: LinkFormValues,
): CreateLinkPayload {
  const payload: CreateLinkPayload = {
    originalUrl: values.originalUrl.trim(),
  };
  const alias = values.customAlias.trim();
  if (alias) payload.customAlias = alias;
  const expiresAt = buildExpiresAt(values.expiresAt);
  if (expiresAt) payload.expiresAt = expiresAt;
  return payload;
}

export function toUpdatePayload(values: LinkFormValues): UpdateLinkPayload {
  return {
    originalUrl: values.originalUrl.trim(),
    expiresAt: buildExpiresAt(values.expiresAt) ?? null,
  };
}
