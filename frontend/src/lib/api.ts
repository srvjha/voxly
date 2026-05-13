import { useAuth } from "@clerk/clerk-react";
import { useCallback, useMemo } from "react";
import type {
  Analytics,
  CreatePollPayload,
  Me,
  Poll,
  PollListItem,
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

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(
      res.status,
      message,
      typeof data === "object" && data !== null ? data : undefined,
    );
  }
  return data as T;
}

export function useApi() {
  const { getToken } = useAuth();

  const auth = useCallback(async () => {
    try {
      return (await getToken()) ?? null;
    } catch {
      return null;
    }
  }, [getToken]);

  return useMemo(
    () => ({
      // auth
      async me(): Promise<Me> {
        return request("/auth/me", { token: await auth() });
      },

      // polls (creator)
      async listMyPolls(): Promise<{ polls: PollListItem[] }> {
        return request("/polls", { token: await auth() });
      },
      async createPoll(payload: CreatePollPayload): Promise<{ poll: Poll }> {
        return request("/polls", {
          method: "POST",
          body: payload,
          token: await auth(),
        });
      },
      async updatePoll(
        id: string,
        payload: CreatePollPayload,
      ): Promise<{ poll: Poll }> {
        return request(`/polls/${id}`, {
          method: "PATCH",
          body: payload,
          token: await auth(),
        });
      },
      async activatePoll(id: string): Promise<{ poll: Poll }> {
        return request(`/polls/${id}/activate`, {
          method: "POST",
          token: await auth(),
        });
      },
      async publishPoll(id: string): Promise<{ poll: Poll }> {
        return request(`/polls/${id}/publish`, {
          method: "POST",
          token: await auth(),
        });
      },
      async deletePoll(id: string): Promise<void> {
        return request(`/polls/${id}`, {
          method: "DELETE",
          token: await auth(),
        });
      },
      async getAnalytics(id: string): Promise<{ analytics: Analytics }> {
        return request(`/polls/${id}/analytics`, { token: await auth() });
      },

      // polls (public / mixed)
      async getPoll(id: string): Promise<{ poll: Poll }> {
        return request(`/polls/${id}`, { token: await auth() });
      },
      async submitResponse(
        id: string,
        payload: SubmitResponsePayload,
      ): Promise<{ response: { id: string } }> {
        return request(`/polls/${id}/responses`, {
          method: "POST",
          body: payload,
          token: await auth(),
        });
      },
    }),
    [auth],
  );
}
