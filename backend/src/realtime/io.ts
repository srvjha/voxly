import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { validate as isUuid } from "uuid";
import { env } from "../utils/env.js";

interface ServerToClientEvents {
  "poll:update": (payload: { pollId: string }) => void;
}

interface ClientToServerEvents {
  "poll:subscribe": (pollId: string) => void;
  "poll:unsubscribe": (pollId: string) => void;
}

type TypedIOServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

let io: TypedIOServer | null = null;

function roomFor(pollId: string) {
  return `poll:${pollId}`;
}

function isValidPollId(value: unknown): value is string {
  return typeof value === "string" && isUuid(value);
}

export function initIO(httpServer: HttpServer): TypedIOServer {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: { origin: env.CORS_ORIGINS, credentials: true },
    },
  );

  io.on("connection", (socket) => {
    socket.on("poll:subscribe", (pollId) => {
      if (!isValidPollId(pollId)) return;
      socket.join(roomFor(pollId));
    });

    socket.on("poll:unsubscribe", (pollId) => {
      if (!isValidPollId(pollId)) return;
      socket.leave(roomFor(pollId));
    });
  });

  return io;
}

export function broadcastPollUpdate(pollId: string) {
  if (!io) return;
  io.to(roomFor(pollId)).emit("poll:update", { pollId });
}
