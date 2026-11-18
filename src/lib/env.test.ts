import { describe, expect, it } from "vitest";
import { features, parseEnv } from "./env";

const valid = {
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgres://user:pass@localhost:5432/whatstuck",
  AUTH_SECRET: "a".repeat(32),
  IP_HASH_SALT: "b".repeat(16),
  CRON_SECRET: "c".repeat(32),
};

describe("parseEnv", () => {
  it("accepts a valid core configuration", () => {
    const env = parseEnv(valid);
    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.ANTHROPIC_MODEL).toBe("claude-sonnet-5-5");
  });

  it("names every missing or invalid value", () => {
    expect(() => parseEnv({ ...valid, AUTH_SECRET: "short", DATABASE_URL: undefined })).toThrow(
      /AUTH_SECRET[\s\S]*DATABASE_URL|DATABASE_URL[\s\S]*AUTH_SECRET/,
    );
  });

  it("rejects a non-postgres database URL", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "mysql://x" })).toThrow(/DATABASE_URL/);
  });

  it("treats empty strings as unset", () => {
    const env = parseEnv({ ...valid, ANTHROPIC_API_KEY: "" });
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
  });
});

describe("features", () => {
  it("turns AI on with either a Gemini or a Claude key", () => {
    expect(features(parseEnv({ ...valid, GEMINI_API_KEY: "g" })).ai).toBe(true);
    expect(features(parseEnv({ ...valid, ANTHROPIC_API_KEY: "a" })).ai).toBe(true);
  });

  it("is off when keys are missing", () => {
    expect(features(parseEnv(valid))).toEqual({ ai: false, email: false });
  });

  it("needs both the Resend key and a sender for email", () => {
    expect(features(parseEnv({ ...valid, RESEND_API_KEY: "re_x" })).email).toBe(false);
    expect(
      features(parseEnv({ ...valid, RESEND_API_KEY: "re_x", EMAIL_FROM: "a@b.co" })).email,
    ).toBe(true);
  });
});
