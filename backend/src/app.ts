import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import authRouter from "./app/auth/auth.routes.js";
import pollsRouter from "./app/polls/polls.routes.js";
import { errorHandler } from "./middleware/index.js";
import { env } from "./utils/env.js";
import ApiResponse from "./utils/api-response.js";

function createExpressApplication(): Express {
  const app = express();

  app.set("trust proxy", true);

  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );

  app.use(clerkMiddleware());

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/auth/webhook") return next();
    express.json()(req, res, next);
  });
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (_req, res) =>
    ApiResponse.ok({ res, message: "ok", data: { health: "ok" } }),
  );

  app.use("/auth", authRouter);
  app.use("/polls", pollsRouter);

  app.use(errorHandler);

  return app;
}

export { createExpressApplication };
