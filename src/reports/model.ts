import "server-only";
import { features, getEnv } from "@/lib/env";
import { HttpError } from "@/lib/http";
import { AnthropicReportModel } from "./model-anthropic";
import type { ModelOutput } from "./schema";

export type ModelResult = {
  output: ModelOutput | null;
  /** "end_turn" when complete; "refusal" and "max_tokens" mean the output can't be trusted. */
  stopReason: string | null;
};

/** The one thing the report needs from an LLM. Tests and evals swap in their own. */
export interface ReportModel {
  readonly name: string;
  run(system: string, user: string, maxTokens: number): Promise<ModelResult>;
}

export function getReportModel(): ReportModel {
  const env = getEnv();
  if (!features(env).ai) {
    throw new HttpError(503, "AI reports aren't set up yet. Ask your admin to add the AI key.");
  }
  return new AnthropicReportModel(env.ANTHROPIC_API_KEY!, env.ANTHROPIC_MODEL);
}
