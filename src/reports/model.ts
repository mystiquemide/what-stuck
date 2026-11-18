import "server-only";
import { features, getEnv } from "@/lib/env";
import { HttpError } from "@/lib/http";
import { createReflectionDrafter, createReportModel } from "./providers";
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

export interface ReflectionDrafter {
  draft(system: string, user: string): Promise<string | null>;
}

export function getReportModel(): ReportModel {
  const env = getEnv();
  const model = features(env).ai ? createReportModel(env) : null;
  if (!model)
    throw new HttpError(503, "AI reports aren't set up yet. Ask your admin to add the AI key.");
  return model;
}

export function getReflectionDrafter(): ReflectionDrafter {
  const env = getEnv();
  const drafter = features(env).ai ? createReflectionDrafter(env) : null;
  if (!drafter) {
    throw new HttpError(
      503,
      "AI drafting isn't set up yet. You can still write the question yourself.",
    );
  }
  return drafter;
}
