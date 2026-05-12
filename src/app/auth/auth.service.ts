import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import type { ClerkUserData } from "./auth.schema.js";

function pickPrimaryEmail(data: ClerkUserData): string {
  const primaryId = data.primary_email_address_id;
  const primary = primaryId
    ? data.email_addresses.find((e) => e.id === primaryId)
    : undefined;
  return (primary ?? data.email_addresses[0]!).email_address;
}

function buildName(data: ClerkUserData): string | null {
  const parts = [data.first_name, data.last_name].filter(
    (p): p is string => typeof p === "string" && p.length > 0,
  );
  return parts.length > 0 ? parts.join(" ") : null;
}

export async function findByClerkId(clerkId: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertFromClerk(data: ClerkUserData) {
  const email = pickPrimaryEmail(data);
  const name = buildName(data);

  const [row] = await db
    .insert(users)
    .values({ clerkId: data.id, email, name })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email, name },
    })
    .returning();

  return row!;
}

export async function deleteByClerkId(clerkId: string) {
  await db.delete(users).where(eq(users.clerkId, clerkId));
}
