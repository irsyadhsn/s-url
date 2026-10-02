import { z } from "zod";

export const checkoutSchema = z
  .object({
    plan: z.literal("premium", "Only the premium plan can be purchased"),
  })
  .strict();

export type CheckoutBody = z.infer<typeof checkoutSchema>;
