import { describe, expect, it } from "vitest";
import { assertCron } from "./cron";

const secret = "s".repeat(40);
const req = (auth?: string) =>
  new Request("http://x", { headers: auth ? { authorization: auth } : {} });

describe("assertCron", () => {
  it("accepts the right secret", () => {
    expect(() => assertCron(req(`Bearer ${secret}`), secret)).not.toThrow();
  });

  it("rejects missing or wrong secrets", () => {
    expect(() => assertCron(req(), secret)).toThrow();
    expect(() => assertCron(req("Bearer nope"), secret)).toThrow();
    expect(() => assertCron(req(`Bearer ${"t".repeat(40)}`), secret)).toThrow();
  });
});
