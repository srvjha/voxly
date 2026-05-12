import { getAuth, requireAuth as clerkRequireAuth } from "@clerk/express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { findByClerkId, upsertFromClerk } from "./auth.service.js";
import { clerkClient } from "@clerk/express";

declare global {
  namespace Express {
    interface Request {
      dbUser?: {
        id: string;
        clerkId: string;
        email: string;
        name: string | null;
      };
    }
  }
}

export const requireAuth: RequestHandler = clerkRequireAuth();

export async function loadDbUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    let user = await findByClerkId(userId);

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      user = await upsertFromClerk({
        id: clerkUser.id,
        email_addresses: clerkUser.emailAddresses.map((e) => ({
          id: e.id,
          email_address: e.emailAddress,
        })),
        primary_email_address_id: clerkUser.primaryEmailAddressId ?? null,
        first_name: clerkUser.firstName ?? null,
        last_name: clerkUser.lastName ?? null,
      });
    }

    req.dbUser = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (err) {
    next(err);
  }
}
