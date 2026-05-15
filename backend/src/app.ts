import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import authRouter from "./app/auth/auth.routes.js";
import pollsRouter from "./app/polls/polls.routes.js";
import { HttpError } from "./http-error.js";

function createExpressApplication(): Express {
  const app = express();

  // Behind ngrok / a reverse proxy, req.ip would otherwise be the proxy's IP.
  // Trusting proxies makes Express read X-Forwarded-For for the real client IP.
  app.set("trust proxy", true);

  const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );

  app.use(clerkMiddleware());

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/auth/webhook") return next();
    express.json()(req, res, next);
  });
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (_req, res) => {
    res.json({ health: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/polls", pollsRouter);

  app.use(
    (err: unknown, _req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent) return next(err);
      if (err instanceof HttpError) {
        return res
          .status(err.status)
          .json({ error: err.message, details: err.details });
      }
      console.error("Unhandled error:", err);
      return res.status(500).json({ error: "InternalServerError" });
    },
  );

  return app;
}

export { createExpressApplication };
