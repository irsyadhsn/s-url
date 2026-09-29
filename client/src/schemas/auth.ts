import { z } from "zod";

/** Mirrors server/src/modules/auth/auth.schemas.ts */
export const loginSchema = z.object({
  email: z
    .email("Invalid email address")
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

/** Mirrors server register schema + client-only confirmPassword. */
export const registerSchema = z
  .object({
    email: z
      .email("Invalid email address")
      .transform((v) => v.toLowerCase()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginValues = z.input<typeof loginSchema>;
export type RegisterValues = z.input<typeof registerSchema>;
