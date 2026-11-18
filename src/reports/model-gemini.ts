import { z } from "zod";
import type { ModelResult, ReportModel } from "./model";
import { modelOutputSchema } from "./schema";

const API = "https://generativelanguage.googleapis.com/v1beta/models";

/** Gemini finish reasons that mean the output was withheld or can't be trusted. */
const BLOCKED = new Set([
  "SAFETY",
  "RECITATION",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
  "IMAGE_SAFETY",
]);

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
  }>;
  promptFeedback?: { blockReason?: string };
};

/** A model has used up its quota (for example, the free tier's daily allowance). Try the next one. */
class QuotaExhaustedError extends Error {}

/** JSON Schema for Gemini's responseJsonSchema, from the same Zod schema we validate with. */
function jsonSchema(schema: z.ZodType) {
  const schemaJson = z.toJSONSchema(schema) as Record<string, unknown>;
  delete schemaJson.$schema;
  return schemaJson;
}

async function generateOnce(
  apiKey: string,
  model: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<GeminiResponse> {
  // Short retries for brief rate limits and server errors.
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.ok) return (await response.json()) as GeminiResponse;

    if (response.status === 429) {
      // A daily quota won't recover with a retry; move on to the next model.
      const detail = await response.text().catch(() => "");
      if (/PerDay|RESOURCE_EXHAUSTED/.test(detail)) throw new QuotaExhaustedError(model);
    }
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= 2) {
      // Status only: error bodies can echo the request.
      throw new Error(`Gemini request failed (HTTP ${response.status}).`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
  }
}

/**
 * Try each model in order, moving to the next when one's quota is used up.
 * Returns the response and the model that actually answered.
 */
async function generate(
  apiKey: string,
  models: readonly string[],
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ response: GeminiResponse; model: string }> {
  for (const model of models) {
    try {
      return { response: await generateOnce(apiKey, model, body, timeoutMs), model };
    } catch (error) {
      if (!(error instanceof QuotaExhaustedError)) throw error;
    }
  }
  throw new Error("Every configured Gemini model is out of quota for today.");
}

function readText(response: GeminiResponse) {
  const candidate = response.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
  return {
    text,
    finishReason: candidate?.finishReason,
    blocked: response.promptFeedback?.blockReason,
  };
}

function stopReason(finishReason: string | undefined, blocked: string | undefined) {
  if (blocked || (finishReason && BLOCKED.has(finishReason))) return "refusal";
  if (finishReason === "MAX_TOKENS") return "max_tokens";
  if (finishReason === "STOP") return "end_turn";
  return finishReason?.toLowerCase() ?? "unknown";
}

/** Parse "a, b, c" into a clean model list. */
export function parseModels(value: string): string[] {
  return value
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

/** Gemini with schema-constrained JSON output. No env access here so scripts can use it too. */
export class GeminiReportModel implements ReportModel {
  readonly name: string;
  private readonly models: string[];

  constructor(
    private readonly apiKey: string,
    models: string,
  ) {
    this.models = parseModels(models);
    this.name = this.models[0] ?? "gemini";
  }

  async run(system: string, user: string, maxTokens: number): Promise<ModelResult> {
    const { response, model } = await generate(
      this.apiKey,
      this.models,
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema(modelOutputSchema),
          // Thinking tokens count toward the limit on newer models, so allow headroom.
          maxOutputTokens: maxTokens * 4,
        },
      },
      120_000,
    );

    const { text, finishReason, blocked } = readText(response);
    const reason = stopReason(finishReason, blocked);
    if (reason !== "end_turn") return { output: null, stopReason: reason, model };

    try {
      const parsed = modelOutputSchema.safeParse(JSON.parse(text));
      return parsed.success
        ? { output: parsed.data, stopReason: "end_turn", model }
        : { output: null, stopReason: "parse_error", model };
    } catch {
      return { output: null, stopReason: "parse_error", model };
    }
  }
}

const reflectionSchema = z.object({ question: z.string() });

/** Drafts the Wednesday reflection question. The pastor edits and approves it before use. */
export class GeminiReflectionDrafter {
  private readonly models: string[];

  constructor(
    private readonly apiKey: string,
    models: string,
  ) {
    this.models = parseModels(models);
  }

  async draft(system: string, user: string): Promise<string | null> {
    const { response } = await generate(
      this.apiKey,
      this.models,
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema(reflectionSchema),
          maxOutputTokens: 2_000,
        },
      },
      45_000,
    );
    const { text, finishReason, blocked } = readText(response);
    if (stopReason(finishReason, blocked) !== "end_turn") return null;
    try {
      const parsed = reflectionSchema.safeParse(JSON.parse(text));
      return parsed.success ? parsed.data.question.trim() || null : null;
    } catch {
      return null;
    }
  }
}
