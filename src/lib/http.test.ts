import { describe, expect, it } from "vitest";
import { z } from "zod";
import { assertSameOrigin, clientIp, HttpError, readJson } from "./http";
import { route } from "./route";

describe("route", () => {
  it("turns HttpError into JSON with its status", async () => {
    const res = await route(async () => {
      throw new HttpError(429, "Slow down.", { retryAfterSeconds: 5 });
    })();
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "Slow down.", retryAfterSeconds: 5 });
  });

  it("hides unexpected errors behind a generic 500", async () => {
    const original = console.error;
    console.error = () => {};
    const res = await route(async () => {
      throw new Error("database password is hunter2");
    })();
    console.error = original;
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("hunter2");
  });

  it("never shows library default wording", async () => {
    const res = await route(async (req: Request) => {
      await readJson(req, z.object({ count: z.number() }));
      return Response.json({});
    })(new Request("http://x", { method: "POST", body: JSON.stringify({ count: "x" }) }));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/expected|Invalid input/i);
    expect(body.fields[0].message).toBe("Check this answer and try again.");
  });

  it("explains an unreadable request in plain words", async () => {
    const res = await route(async (req: Request) => {
      await readJson(req, z.object({ a: z.string() }));
      return Response.json({});
    })(new Request("http://x", { method: "POST", body: JSON.stringify("just text") }));
    expect((await res.json()).error).toBe("We couldn't read that. Refresh the page and try again.");
  });

  it("turns validation failures into a 400 with field names", async () => {
    const res = await route(async (req: Request) => {
      await readJson(req, z.object({ email: z.email() }));
      return Response.json({});
    })(new Request("http://x", { method: "POST", body: JSON.stringify({ email: "nope" }) }));
    expect(res.status).toBe(400);
    expect((await res.json()).fields[0].path).toBe("email");
  });

  it("rejects a body that isn't JSON", async () => {
    const res = await route(async (req: Request) => {
      await readJson(req, z.object({}));
      return Response.json({});
    })(new Request("http://x", { method: "POST", body: "not json" }));
    expect(res.status).toBe(400);
  });
});

describe("assertSameOrigin", () => {
  const app = "https://whatstuck.example";
  const req = (origin?: string) =>
    new Request(`${app}/api/x`, { method: "POST", headers: origin ? { origin } : {} });

  it("allows our own origin and requests without one", () => {
    expect(() => assertSameOrigin(req(app), app)).not.toThrow();
    expect(() => assertSameOrigin(req(), app)).not.toThrow();
  });

  it("blocks other sites", () => {
    expect(() => assertSameOrigin(req("https://evil.example"), app)).toThrow(HttpError);
  });
});

describe("clientIp", () => {
  it("uses the first forwarded address", () => {
    const r = new Request("http://x", { headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" } });
    expect(clientIp(r)).toBe("203.0.113.9");
  });
});
