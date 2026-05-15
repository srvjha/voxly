import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import type {
  Analytics,
  CreatePollPayload,
  Me,
  Poll,
  PollListItem,
  PollParticipationItem,
  SubmitResponsePayload,
} from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const baseClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

interface SuccessEnvelope<T> {
  success: true;
  message: string;
  data: T | null;
}
interface ErrorEnvelope {
  success: false;
  message: string;
  error?: string;
  source?: string;
  issues?: Array<{ path: string; message: string; code?: string }>;
}

function looksLikeEnvelope(v: unknown): v is { success: boolean } {
  return (
    typeof v === "object" &&
    v !== null &&
    "success" in v &&
    typeof (v as { success: unknown }).success === "boolean"
  );
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const d = data as Partial<ErrorEnvelope> & { error?: string };
    return d.message ?? d.error ?? fallback;
  }
  return fallback;
}

async function send<T>(
  client: AxiosInstance,
  config: AxiosRequestConfig,
  token: string | null,
): Promise<T> {
  try {
    const res = await client.request<unknown>({
      ...config,
      headers: {
        ...config.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const body = res.data;
    if (looksLikeEnvelope(body) && body.success === true) {
      const data = (body as SuccessEnvelope<T>).data;
      return (data ?? (undefined as unknown)) as T;
    }
    return body as T;
  } catch (err) {
    if (err instanceof AxiosError) {
      const status = err.response?.status ?? 0;
      const data = err.response?.data;
      const message = extractErrorMessage(
        data,
        err.message || `Request failed (${status})`,
      );
      throw new ApiError(
        status,
        message,
        typeof data === "object" && data !== null ? data : undefined,
      );
    }
    throw err;
  }
}

export function useApi() {
  const { getToken } = useAuth();

  return useMemo(() => {
    const auth = async () => {
      try {
        return (await getToken()) ?? null;
      } catch {
        return null;
      }
    };

    return {
      async me(): Promise<Me> {
        return send(baseClient, { url: "/auth/me", method: "GET" }, await auth());
      },

      async listMyPolls(): Promise<{ polls: PollListItem[] }> {
        return send(baseClient, { url: "/polls", method: "GET" }, await auth());
      },
      async listParticipatedPolls(): Promise<{
        polls: PollParticipationItem[];
      }> {
        return send(
          baseClient,
          { url: "/polls/participated", method: "GET" },
          await auth(),
        );
      },
      async createPoll(payload: CreatePollPayload): Promise<{ poll: Poll }> {
        return send(
          baseClient,
          { url: "/polls", method: "POST", data: payload },
          await auth(),
        );
      },
      async updatePoll(
        id: string,
        payload: CreatePollPayload,
      ): Promise<{ poll: Poll }> {
        return send(
          baseClient,
          { url: `/polls/${id}`, method: "PATCH", data: payload },
          await auth(),
        );
      },
      async activatePoll(id: string): Promise<{ poll: Poll }> {
        return send(
          baseClient,
          { url: `/polls/${id}/activate`, method: "POST" },
          await auth(),
        );
      },
      async publishPoll(id: string): Promise<{ poll: Poll }> {
        return send(
          baseClient,
          { url: `/polls/${id}/publish`, method: "POST" },
          await auth(),
        );
      },
      async deletePoll(id: string): Promise<void> {
        return send(
          baseClient,
          { url: `/polls/${id}`, method: "DELETE" },
          await auth(),
        );
      },
      async getAnalytics(id: string): Promise<{ analytics: Analytics }> {
        return send(
          baseClient,
          { url: `/polls/${id}/analytics`, method: "GET" },
          await auth(),
        );
      },

      async getPoll(id: string): Promise<{ poll: Poll }> {
        return send(
          baseClient,
          { url: `/polls/${id}`, method: "GET" },
          await auth(),
        );
      },
      async submitResponse(
        id: string,
        payload: SubmitResponsePayload,
      ): Promise<{ response: { id: string } }> {
        return send(
          baseClient,
          { url: `/polls/${id}/responses`, method: "POST", data: payload },
          await auth(),
        );
      },
    };
  }, [getToken]);
}
