import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

/* ────────────────────────────────────────────────────────────────────
   Validated environment variables — single source of truth.
   Import { env } from "../utils/env.js" anywhere instead of touching
   process.env directly. Fails fast at startup if config is wrong.
   ──────────────────────────────────────────────────────────────────── */

const csvList = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(8080),

  DATABASE_URL: z.string().url(),

  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "CLERK_PUBLISHABLE_KEY is required"),
  CLERK_WEBHOOK_SECRET: z
    .string()
    .min(1, "CLERK_WEBHOOK_SECRET is required"),

  /** Comma-separated list. Defaults to local Vite dev origin. */
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform(csvList),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  console.error("Invalid environment configuration:\n" + issues);
  // Crash hard — there's no safe default to fall back to.
  process.exit(1);
}

export const env = parsed.data;

export type Env = typeof env;
