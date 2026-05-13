import { z } from "zod";

const emailAddress = z.object({
  id: z.string(),
  email_address: z.string().email(),
});

const userData = z.object({
  id: z.string(),
  email_addresses: z.array(emailAddress).min(1),
  primary_email_address_id: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
});

export const clerkUserCreatedEvent = z.object({
  type: z.literal("user.created"),
  data: userData,
});

export const clerkUserUpdatedEvent = z.object({
  type: z.literal("user.updated"),
  data: userData,
});

export const clerkUserDeletedEvent = z.object({
  type: z.literal("user.deleted"),
  data: z.object({
    id: z.string(),
    deleted: z.boolean().optional(),
  }),
});

export const clerkWebhookEvent = z.discriminatedUnion("type", [
  clerkUserCreatedEvent,
  clerkUserUpdatedEvent,
  clerkUserDeletedEvent,
]);

export type ClerkUserData = z.infer<typeof userData>;
export type ClerkWebhookEvent = z.infer<typeof clerkWebhookEvent>;
