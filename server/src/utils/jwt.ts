import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "./errors.js";

export function signAccessToken(userId: string): string {
  const options: SignOptions = {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign({}, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw ApiError.unauthorized("Invalid or expired token");
    }
    return payload.sub;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw ApiError.unauthorized("Invalid or expired token");
  }
}