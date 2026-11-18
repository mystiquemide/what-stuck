import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiReportModel } from "./model-gemini";
import type { ModelOutput } from "./schema";

const output: ModelOutput = {
  alignment: { level: "close", reason: "r" },
  summary: "s",
  themes: [{ label: "t", summary: "s", reply_ids: ["r1"] }],
  drift: [],
  questions: [],
  care: [],
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const candidate = (finishReason: string, parts: Array<{ text: string; thought?: boolean }>) => ({
  candidates: [{ finishReason, content: { parts } }],
});

afterEach(() => vi.unstubAllGlobals());

describe("GeminiReportModel", () => {
  const model = new GeminiReportModel("test-key", "gemini-test");

  it("sends the schema and system prompt, and parses JSON while skipping thoughts", async () => {
    const fetchMock = vi.fn(async () =>
      reply(
        candidate("STOP", [
          { text: "thinking...", thought: true },
          { text: JSON.stringify(output) },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await model.run("SYSTEM", "USER", 4000);
    expect(result).toEqual({ output, stopReason: "end_turn", model: "gemini-test" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/models/gemini-test:generateContent");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
    const body = JSON.parse(String(init.body));
    expect(body.systemInstruction.parts[0].text).toBe("SYSTEM");
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseJsonSchema.required).toContain("themes");
    expect(body.generationConfig.responseJsonSchema.$schema).toBeUndefined();
  });

  it("reports a cut-off answer as max_tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => reply(candidate("MAX_TOKENS", [{ text: '{"alig' }]))),
    );
    expect(await model.run("s", "u", 10)).toMatchObject({ output: null, stopReason: "max_tokens" });
  });

  it("reports a safety block as a refusal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => reply(candidate("SAFETY", []))),
    );
    expect((await model.run("s", "u", 10)).stopReason).toBe("refusal");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => reply({ promptFeedback: { blockReason: "OTHER" } })),
    );
    expect((await model.run("s", "u", 10)).stopReason).toBe("refusal");
  });

  it("treats JSON that doesn't match the schema as unusable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => reply(candidate("STOP", [{ text: '{"themes": "nope"}' }]))),
    );
    expect(await model.run("s", "u", 10)).toMatchObject({
      output: null,
      stopReason: "parse_error",
    });
  });

  it("retries rate limits, then succeeds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply({}, 429))
      .mockResolvedValueOnce(reply(candidate("STOP", [{ text: JSON.stringify(output) }])));
    vi.stubGlobal("fetch", fetchMock);
    const pending = model.run("s", "u", 10);
    await vi.runAllTimersAsync();
    expect((await pending).stopReason).toBe("end_turn");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("moves to the next model when one is out of daily quota, and says which answered", async () => {
    const fallback = new GeminiReportModel("test-key", "first-model, second-model");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        reply(
          {
            error: {
              status: "RESOURCE_EXHAUSTED",
              details: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" }],
            },
          },
          429,
        ),
      )
      .mockResolvedValueOnce(reply(candidate("STOP", [{ text: JSON.stringify(output) }])));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fallback.run("s", "u", 10);
    expect(result).toEqual({ output, stopReason: "end_turn", model: "second-model" });
    expect(String(fetchMock.mock.calls[1]![0])).toContain("/models/second-model:");
  });

  it("gives up cleanly when every model is out of quota", async () => {
    const fallback = new GeminiReportModel("test-key", "a,b");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => reply({ error: { status: "RESOURCE_EXHAUSTED" } }, 429)),
    );
    await expect(fallback.run("s", "u", 10)).rejects.toThrow(/out of quota/);
  });

  it("fails fast on a bad key without leaking the response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => reply({ error: { message: "API key test-key invalid" } }, 400)),
    );
    await expect(model.run("s", "u", 10)).rejects.toThrow("Gemini request failed (HTTP 400).");
  });
});
