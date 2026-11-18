import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { ModelResult, ReportModel } from "./model";
import { z } from "zod";
import { modelOutputSchema } from "./schema";

/** Claude with schema-constrained JSON output. No env access here so scripts can use it too. */
export class AnthropicReportModel implements ReportModel {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    readonly name: string,
  ) {
    // Explicit base URL so a stray ANTHROPIC_BASE_URL in the environment can't redirect traffic.
    this.client = new Anthropic({
      apiKey,
      baseURL: "https://api.anthropic.com",
      maxRetries: 2,
      timeout: 90_000,
    });
  }

  async run(system: string, user: string, maxTokens: number): Promise<ModelResult> {
    try {
      const response = await this.client.messages.parse({
        model: this.name,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
        output_config: { format: zodOutputFormat(modelOutputSchema) },
      });
      return { output: response.parsed_output ?? null, stopReason: response.stop_reason };
    } catch (error) {
      // Parse failures (from refusals or truncation) come back as "no output", not a crash.
      if (error instanceof Anthropic.APIError) throw error;
      return { output: null, stopReason: "parse_error" };
    }
  }
}

const reflectionSchema = z.object({ question: z.string() });

/** Drafts the Wednesday reflection question. The pastor edits and approves it before use. */
export class AnthropicReflectionDrafter {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    readonly name: string,
  ) {
    this.client = new Anthropic({
      apiKey,
      baseURL: "https://api.anthropic.com",
      maxRetries: 2,
      timeout: 30_000,
    });
  }

  async draft(system: string, user: string): Promise<string | null> {
    const response = await this.client.messages.parse({
      model: this.name,
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: zodOutputFormat(reflectionSchema) },
    });
    if (response.stop_reason !== "end_turn") return null;
    return response.parsed_output?.question.trim() || null;
  }
}
