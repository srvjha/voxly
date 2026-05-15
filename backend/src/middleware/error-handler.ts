import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import type { ApiErrorBody } from "../utils/api-response.js";

/* ────────────────────────────────────────────────────────────────────
   Centralized Express error handler. Translates ApiError into the
   shared `ApiErrorBody` envelope. Anything else becomes a generic 500
   — we deliberately don't leak the underlying error to the client.
   ──────────────────────────────────────────────────────────────────── */

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) return next(err);

  if (err instanceof ApiError) {
    return ApiResponse.error(res, err);
  }

  console.error("Unhandled error:", err);
  const body: ApiErrorBody = {
    success: false,
    message: "InternalServerError",
  };
  return res.status(500).json(body);
}
