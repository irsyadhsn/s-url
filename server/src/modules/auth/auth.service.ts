import bcrypt from "bcrypt";
import { hasPgErrorCode } from "../../db/errors.js";
import { ApiError } from "../../utils/errors.js";
import { signAccessToken } from "../../utils/jwt.js";
import { effectivePlan, planExpiryOrNull } from "../billing/plan.js";
import type { LoginBody, RegisterBody } from "./auth.schemas.js";
import * as userRepo from "./auth.repository.js";

const BCRYPT_ROUNDS = 12;

const PG_UNIQUE_VIOLATION = "23505";

export interface PublicUser {
  id: string;
  email: string;
  role: "user" | "admin";
  /** Effective plan — a lapsed premium period reports as free. */
  plan: "free" | "premium";
  planExpiresAt: string | null;
  createdAt: Date;
}

export function toPublicUser(user: {
  id: string;
  email: string;
  role: "user" | "admin";
  plan: "free" | "premium";
  planExpiresAt: Date | null;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    plan: effectivePlan(user),
    planExpiresAt: planExpiryOrNull(user),
    createdAt: user.createdAt,
  };
}

export async function register(input: RegisterBody): Promise<PublicUser> {
  const existing = await userRepo.findByEmail(input.email);
  if (existing) {
    throw ApiError.conflict(
      "An account with this email already exists",
      "EMAIL_TAKEN",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  let user;
  try {
    user = await userRepo.create({ email: input.email, passwordHash });
  } catch (err) {
    if (hasPgErrorCode(err, PG_UNIQUE_VIOLATION)) {
      throw ApiError.conflict(
        "An account with this email already exists",
        "EMAIL_TAKEN",
      );
    }
    throw err;
  }

  return toPublicUser(user);
}

export async function login(input: LoginBody): Promise<{
  token: string;
  user: PublicUser;
}> {
  const user = await userRepo.findByEmail(input.email);

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password",
    );
  }

  return { token: signAccessToken(user.id), user: toPublicUser(user) };
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw ApiError.unauthorized("Account no longer exists");
  }
  return toPublicUser(user);
}