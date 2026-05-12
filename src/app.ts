import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { clerkMiddleware } from "@clerk/express";
import authRouter from "./app/auth/auth.routes.js";

function createExpressApplication(): Express {
  const app = express();

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

  return app;
}

export { createExpressApplication };
