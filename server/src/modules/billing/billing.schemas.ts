import { z } from "zod";

/**
 * Only Premium is purchasable — the free plan is the default state of a
 * new account, so there is deliberately no way to "buy" it.
 */
export const checkoutSchema = z
  .object({
    plan: z.literal("premium", "Only the premium plan can be purchased"),
  })
  .strict();

export type CheckoutBody = z.infer<typeof checkoutSchema>;
