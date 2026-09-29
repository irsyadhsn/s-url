import { z } from "zod";

export const codeParamSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(64, "Code too long"),
});

export type CodeParam = z.infer<typeof codeParamSchema>;