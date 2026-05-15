import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

interface ServerToClientEvents {
  "poll:update": (payload: { pollId: string }) => void;
}

interface ClientToServerEvents {
  "poll:subscribe": (pollId: string) => void;
  "poll:unsubscribe": (pollId: string) => void;
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

let socket: TypedSocket | null = null;

function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(API_BASE, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function usePollRoom(
  pollId: string | undefined,
  onUpdate: () => void,
) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  useEffect(() => {
    if (!pollId) return;
    const s = getSocket();

    const subscribe = () => s.emit("poll:subscribe", pollId);
    const handler = (payload: { pollId: string }) => {
      if (payload.pollId === pollId) cbRef.current();
    };

    subscribe();
    s.on("connect", subscribe);
    s.on("poll:update", handler);

    return () => {
      s.emit("poll:unsubscribe", pollId);
      s.off("connect", subscribe);
      s.off("poll:update", handler);
    };
  }, [pollId]);
}
