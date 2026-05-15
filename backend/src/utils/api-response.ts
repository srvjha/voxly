import type { Response } from "express";
import ApiError from "./api-error.js";

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
  source?: "body" | "params" | "query";
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

  static ok<T>({ res, message, data = null }: ApiResponseT<T>) {
    return this.send(res, 200, message, data);
  }

  static created<T>({ res, message, data = null }: ApiResponseT<T>) {
    return this.send(res, 201, message, data);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(res: Response, err: ApiError) {
    const body: ApiErrorBody = {
      success: false,
      message: err.message,
    };
    return res.status(err.statusCode).json(body);
  }
}

export default ApiResponse;
