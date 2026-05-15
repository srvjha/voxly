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
    // Skip ngrok's free-tier interstitial HTML page so the request reaches
    // our backend (and CORS headers actually come back).
    "ngrok-skip-browser-warning": "true",
  },
});

async function send<T>(
  client: AxiosInstance,
  config: AxiosRequestConfig,
  token: string | null,
): Promise<T> {
  try {
    const res = await client.request<T>({
      ...config,
      headers: {
        ...config.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.data;
  } catch (err) {
    if (err instanceof AxiosError) {
      const status = err.response?.status ?? 0;
      const data = err.response?.data;
      const message =
        typeof data === "object" && data !== null && "error" in data
          ? String((data as { error: unknown }).error)
          : err.message || `Request failed (${status})`;
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
