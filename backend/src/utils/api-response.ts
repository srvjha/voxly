import type { Response } from "express";
import ApiError from "./api-error.js";

/* ────────────────────────────────────────────────────────────────────
   ApiResponse — uniform success envelope: { success, message, data }.

   All controllers return through ApiResponse.<helper> so every endpoint
   ships the same outer shape. Pair with ApiError + errorHandler for
   the error envelope: { success: false, message, ... }.

   The frontend's axios wrapper unwraps `data` so page code keeps
   seeing the same payload it always did.
   ──────────────────────────────────────────────────────────────────── */

interface ApiResponseT<T = unknown> {
  res: Response;
  message: string;
  data?: T | null;
}

export interface ApiSuccessBody<T = unknown> {
  success: true;
  message: string;
  data: T | null;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  /** Validation-source ("body" | "params" | "query"). */
  source?: "body" | "params" | "query";
  /** Per-field zod issues. */
  issues?: Array<{ path: string; message: string; code?: string }>;
}

class ApiResponse {
  private static send<T>(
    res: Response,
    statusCode: number,
    message: string,
    data: T | null,
  ) {
    const body: ApiSuccessBody<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(body);
  }

  /** 200 OK */
  static ok<T>({ res, message, data = null }: ApiResponseT<T>) {
    return this.send(res, 200, message, data);
  }

  /** 201 Created */
  static created<T>({ res, message, data = null }: ApiResponseT<T>) {
    return this.send(res, 201, message, data);
  }

  /** 204 No Content — no body, no envelope (per HTTP spec). */
  static noContent(res: Response) {
    return res.status(204).send();
  }

  /** Render an ApiError using the unified error envelope. */
  static error(res: Response, err: ApiError) {
    const body: ApiErrorBody = {
      success: false,
      message: err.message,
    };
    return res.status(err.statusCode).json(body);
  }
}

export default ApiResponse;
