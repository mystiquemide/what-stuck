import "server-only";
import { z } from "zod";

/**
 * Server configuration, read from environment variables and validated once.
 *
 * Core values are required: the app refuses to start without them.
 * Feature keys (AI, email) are optional so the app still runs while they
 * are being set up. Code that needs them must check `features()` first.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url(),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "must be a postgres:// connection string"),
  AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
  IP_HASH_SALT: z.string().min(16, "must be at least 16 characters"),
  CRON_SECRET: z.string().min(32, "must be at least 32 characters"),

  // AI: Gemini is used when its key is set, otherwise Claude.
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z
    .string()
    .min(1)
    .default("gemini-2.5-flash,gemini-3-flash-preview,gemini-flash-lite-latest"),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5-5"),

  /** Hard cap on AI calls per day across the whole site, to protect our credit. */
  AI_DAILY_LIMIT: z.coerce.number().int().positive().default(50),

  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Treat empty strings as unset, so `KEY=` in a .env file means "not configured". */
function dropEmpty(source: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ""));
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(dropEmpty(source));
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return result.data;
}

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

export function features(env: Env = getEnv()) {
  return {
    ai: Boolean(env.GEMINI_API_KEY || env.ANTHROPIC_API_KEY),
    email: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
  };
}
