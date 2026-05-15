import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

interface ServerToClientEvents {
  "poll:update": (payload: { pollId: string }) => void;
}

interface ClientToServerEvents {
  "poll:subscribe": (pollId: string) => void;
  "poll:unsubscribe": (pollId: string) => void;
}

type TypedIOServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

let io: TypedIOServer | null = null;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function roomFor(pollId: string) {
  return `poll:${pollId}`;
}

export function initIO(httpServer: HttpServer): TypedIOServer {
  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: { origin: origins, credentials: true },
    },
  );

  io.on("connection", (socket) => {
    socket.on("poll:subscribe", (pollId) => {
      if (typeof pollId !== "string" || !UUID_RE.test(pollId)) return;
      socket.join(roomFor(pollId));
    });

    socket.on("poll:unsubscribe", (pollId) => {
      if (typeof pollId !== "string" || !UUID_RE.test(pollId)) return;
      socket.leave(roomFor(pollId));
    });
  });

  return io;
}

export function broadcastPollUpdate(pollId: string) {
  if (!io) return;
  io.to(roomFor(pollId)).emit("poll:update", { pollId });
}
