import type { Request, Response, NextFunction } from "express";
import { Webhook } from "svix";
import ApiError from "../../utils/api-error.js";
import ApiResponse from "../../utils/api-response.js";
import { env } from "../../utils/env.js";
import {
  clerkWebhookEvent,
  type ClerkWebhookEvent,
} from "./auth.schema.js";
import {
  upsertFromClerk,
  deleteByClerkId,
} from "./auth.service.js";

export async function handleClerkWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const svixId = req.header("svix-id");
    const svixTimestamp = req.header("svix-timestamp");
    const svixSignature = req.header("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw ApiError.badRequest("Missing svix headers");
    }

    const payload = (req.body as Buffer).toString("utf8");

    let verified: unknown;
    try {
      verified = new Webhook(env.CLERK_WEBHOOK_SECRET).verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      throw ApiError.unauthorized("Invalid signature");
    }

    const parsed = clerkWebhookEvent.safeParse(verified);
    if (!parsed.success) {
      throw ApiError.badRequest("Unsupported or malformed event");
    }

    await dispatchEvent(parsed.data);

    return ApiResponse.ok({
      res,
      message: "Webhook processed",
      data: { ok: true },
    });
  } catch (err) {
    next(err);
  }
}

async function dispatchEvent(event: ClerkWebhookEvent) {
  switch (event.type) {
    case "user.created":
    case "user.updated":
      await upsertFromClerk(event.data);
      return;
    case "user.deleted":
      await deleteByClerkId(event.data.id);
      return;
  }
}

export function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.dbUser) throw ApiError.unauthorized();
    return ApiResponse.ok({
      res,
      message: "Current user",
      data: { user: req.dbUser },
    });
  } catch (err) {
    next(err);
  }
}
