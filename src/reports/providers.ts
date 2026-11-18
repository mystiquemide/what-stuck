import { AnthropicReflectionDrafter, AnthropicReportModel } from "./model-anthropic";
import { GeminiReflectionDrafter, GeminiReportModel } from "./model-gemini";
import type { ReflectionDrafter, ReportModel } from "./model";

export type AiConfig = Partial<Record<string, string | undefined>> & {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
};

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5-5";

/** Gemini when its key is set, otherwise Claude. Null when neither is configured. */
export function createReportModel(config: AiConfig): ReportModel | null {
  if (config.GEMINI_API_KEY) {
    return new GeminiReportModel(
      config.GEMINI_API_KEY,
      config.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    );
  }
  if (config.ANTHROPIC_API_KEY) {
    return new AnthropicReportModel(
      config.ANTHROPIC_API_KEY,
      config.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
    );
  }
  return null;
}

export function createReflectionDrafter(config: AiConfig): ReflectionDrafter | null {
  if (config.GEMINI_API_KEY) {
    return new GeminiReflectionDrafter(
      config.GEMINI_API_KEY,
      config.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    );
  }
  if (config.ANTHROPIC_API_KEY) {
    return new AnthropicReflectionDrafter(
      config.ANTHROPIC_API_KEY,
      config.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
    );
  }
  return null;
}
