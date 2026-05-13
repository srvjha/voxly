import { Router } from "express";
import type { Router as RouterType } from "express";
import express from "express";
import { handleClerkWebhook, getMe } from "./auth.controller.js";
import { loadDbUser } from "./auth.middleware.js";

const router: RouterType = Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleClerkWebhook,
);

router.get("/me", loadDbUser, getMe);

export default router;
