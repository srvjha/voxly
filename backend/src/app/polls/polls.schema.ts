import { z } from "zod";

const optionInput = z.object({
  text: z.string().min(1).max(500),
});

const questionInput = z.object({
  text: z.string().min(1).max(2000),
  isMandatory: z.boolean().default(true),
  options: z.array(optionInput).min(2).max(20),
});

export const createPollBody = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  isAnonymous: z.boolean().default(false),
  expiresAt: z
    .string()
    .datetime()
    .refine((s) => new Date(s) > new Date(), {
      message: "expiresAt must be in the future",
    }),
  questions: z.array(questionInput).min(1).max(50),
});

export const updatePollBody = createPollBody;

export const submitResponseBody = z.object({
  anonToken: z.string().min(8).max(255).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        optionId: z.string().uuid(),
      }),
    )
    .min(1),
});

export const pollIdParam = z.object({
  id: z.string().uuid(),
});

export type CreatePollInput = z.infer<typeof createPollBody>;
export type UpdatePollInput = z.infer<typeof updatePollBody>;
export type SubmitResponseInput = z.infer<typeof submitResponseBody>;
