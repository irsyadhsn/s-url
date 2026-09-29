import { ZodError } from "zod";
import { ApiError } from "../services/api";

export type FieldErrors = Record<string, string>;

export interface ParsedError {
  /** Per-field messages keyed by form field name (empty when none). */
  fields: FieldErrors;
  /** Form-level message when there is no field mapping (null when none). */
  message: string | null;
}

interface ZodIssueLike {
  path: PropertyKey[];
  message: string;
}

function issuesToFields(issues: ZodIssueLike[]): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (key && fields[key] === undefined) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

/**
 * Conflict codes the backend uses that map cleanly onto a single field.
 * VALIDATION_ERROR carries zod issues in `details` and is handled generically.
 */
const CODE_TO_FIELD: Record<string, string> = {
  EMAIL_TAKEN: "email",
  ALIAS_TAKEN: "customAlias",
  ALIAS_LIMIT_REACHED: "customAlias",
};

/**
 * Normalizes anything thrown by schemas or the API layer into
 * field errors + a form-level message. Never returns raw unknowns —
 * callers surface `message` inline or via toast.
 */
export function parseError(err: unknown): ParsedError {
  if (err instanceof ZodError) {
    return { fields: issuesToFields(err.issues), message: null };
  }

  if (err instanceof ApiError) {
    const field = CODE_TO_FIELD[err.code];
    if (field) {
      return { fields: { [field]: err.message }, message: null };
    }

    if (Array.isArray(err.details) && err.details.length > 0) {
      const fields = issuesToFields(err.details as ZodIssueLike[]);
      if (Object.keys(fields).length > 0) {
        return { fields, message: null };
      }
    }

    return { fields: {}, message: err.message };
  }

  if (err instanceof Error) {
    return { fields: {}, message: err.message };
  }

  return { fields: {}, message: "Something went wrong. Please try again." };
}
