import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/errors.js";

type Source = "body" | "query" | "params";

const SOURCES: Source[] = ["body", "query", "params"];

function validateWith<T>(schema: ZodType<T>, source: Source) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(
        ApiError.badRequest(
          "Invalid request data",
          "VALIDATION_ERROR",
          result.error.issues,
        ),
      );
      return;
    }

    let validated = (req as { validated?: Record<Source, unknown> }).validated;
    if (!validated) {
      validated = { body: undefined, query: undefined, params: undefined };
      (req as { validated: Record<Source, unknown> }).validated = validated;
    }
    validated[source] = result.data;
    next();
  };
}

export const validateBody = <T>(schema: ZodType<T>) =>
  validateWith(schema, "body");

export const validateQuery = <T>(schema: ZodType<T>) =>
  validateWith(schema, "query");

export const validateParams = <T>(schema: ZodType<T>) =>
  validateWith(schema, "params");