import { clerkClient, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { findByClerkId, upsertFromClerk } from "../app/auth/auth.service.js";
import ApiError from "../utils/api-error.js";

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

async function getOrCreateDbUser(clerkUserId: string) {
  const existing = await findByClerkId(clerkUserId);
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  return upsertFromClerk({
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

export async function loadDbUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return next(ApiError.unauthorized());

    const user = await getOrCreateDbUser(userId);
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

export async function loadOptionalDbUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return next();

    const user = await getOrCreateDbUser(userId);
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
