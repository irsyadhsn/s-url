export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(
    message = "Invalid request",
    code = "BAD_REQUEST",
    details?: unknown,
  ): ApiError {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Access denied"): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(
    message = "Conflict",
    code = "CONFLICT",
    details?: unknown,
  ): ApiError {
    return new ApiError(409, code, message, details);
  }

  static paymentRequired(
    message = "Upgrade required",
    code = "PAYMENT_REQUIRED",
  ): ApiError {
    return new ApiError(402, code, message);
  }
}
