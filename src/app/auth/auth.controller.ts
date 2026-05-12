import type { Request, Response, NextFunction } from "express";
import { Webhook } from "svix";
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
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: CLERK_WEBHOOK_SECRET missing" });
    }

    const svixId = req.header("svix-id");
    const svixTimestamp = req.header("svix-timestamp");
    const svixSignature = req.header("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: "Missing svix headers" });
    }

    const payload = (req.body as Buffer).toString("utf8");

    let verified: unknown;
    try {
      verified = new Webhook(secret).verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const parsed = clerkWebhookEvent.safeParse(verified);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Unsupported or malformed event",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    await dispatchEvent(parsed.data);

    return res.status(200).json({ ok: true });
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

export function getMe(req: Request, res: Response) {
  if (!req.dbUser) {
    return res.status(401).json({ error: "Unauthenticated" });
  }
  return res.json({ user: req.dbUser });
}
